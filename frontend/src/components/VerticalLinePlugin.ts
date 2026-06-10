import { 
    Coordinate, 
    ISeriesPrimitive, 
    IPrimitivePaneRenderer, 
    IPrimitivePaneView, 
    SeriesAttachedParameter, 
    Time 
} from 'lightweight-charts';

class VerticalLineRenderer implements IPrimitivePaneRenderer {
    _x: number | null;
    _color: string;

    constructor(x: number | null, color: string) {
        this._x = x;
        this._color = color;
    }

    draw(target: any) {
        if (this._x === null) return;
        
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            const position = this._x! * scope.horizontalPixelRatio;
            
            ctx.beginPath();
            ctx.moveTo(position, 0);
            ctx.lineTo(position, scope.bitmapSize.height);
            ctx.strokeStyle = this._color;
            ctx.lineWidth = 1 * scope.horizontalPixelRatio; // Thin, premium line
            ctx.setLineDash([5 * scope.horizontalPixelRatio, 5 * scope.horizontalPixelRatio]);
            ctx.stroke();
        });
    }
}

class VerticalLinePaneView implements IPrimitivePaneView {
    _source: VerticalLinePrimitive;
    _x: number | null = null;

    constructor(source: VerticalLinePrimitive) {
        this._source = source;
    }

    update() {
        if (this._source.chart && this._source._time) {
            this._x = this._source.chart.timeScale().timeToCoordinate(this._source._time);
        }
    }

    renderer() {
        return new VerticalLineRenderer(this._x, this._source._color);
    }
}

export class VerticalLinePrimitive implements ISeriesPrimitive {
    _time: Time;
    _color: string;
    chart: any;
    series: any;
    _paneViews: VerticalLinePaneView[];
    requestUpdate: any;

    constructor(time: Time, color: string = 'rgba(212, 175, 55, 0.4)') {
        this._time = time;
        this._color = color;
        this._paneViews = [new VerticalLinePaneView(this)];
    }

    attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
        this.chart = chart;
        this.series = series;
        this.requestUpdate = requestUpdate;
    }

    detached() {
        // cleanup if needed
    }

    paneViews() {
        return this._paneViews;
    }

    updateAllViews() {
        this._paneViews.forEach(pw => pw.update());
    }
}

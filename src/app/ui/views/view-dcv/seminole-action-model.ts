import { Subject, Observable, Observer } from 'rxjs';

export class SeminoleActionModel {

  private _inopEngine: string;
  private _inopEngineSubject: Subject<string>;
  public get inopEngineObservable(): Observable<string> {
    return this._inopEngineSubject.asObservable();
  }
  public get inopEngine(): string {
    return this._inopEngine;
  }
  public set inopEngine(value: string) {
    if(value === 'LEFT' || value === 'RIGHT') {
      this._inopEngine = value;
      this._inopEngineSubject.next(value);
    }
  }

  private _controlTechnique: string;
  private _controlTechniqueSubject: Subject<string>;
  public get controlTehcniqueObservable(): Observable<string> {
    return this._controlTechniqueSubject.asObservable();
  }
  public get controlTechnique(): string {
    return this._controlTechnique;
  }
  public set controlTechnique(value: string) {
    if(value === 'ZERO SIDE SLIP' || 'WINGS LEVEL') {
      this._controlTechnique = value;
      this._controlTechniqueSubject.next(value);
    }
  }

  private _flaps: number;
  private _flapsSubject: Subject<number>;
  public get flapsObservable(): Observable<number> {
    return this._flapsSubject.asObservable();
  }
  public get flaps(): number {
    return this._flaps;
  }
  public set flaps(value: number) {
    if(value >= 0 && value <= 100) {
      this._flaps = value;
      this._flapsSubject.next(value);
    }
  }

  private _gear: string;
  private _gearSubject: Subject<string>;
  public get gearObservable(): Observable<string> {
    return this._gearSubject.asObservable();
  }
  public get gear(): string {
    return this._gear;
  }
  public set gear(value: string) {
    if(value === 'UP' || 'DOWN') {
      this._gear = value;
      this._gearSubject.next(value);
    }
  }

  /**
   *
   */
  constructor() {
    this._inopEngineSubject = new Subject();
    this._controlTechniqueSubject = new Subject();
    this._flapsSubject = new Subject();
    this._gearSubject = new Subject();
  }

  public dispose(): void {
  }

}
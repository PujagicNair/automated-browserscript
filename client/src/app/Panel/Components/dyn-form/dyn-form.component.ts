import { Component, OnInit, forwardRef, Input, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'dyn-form',
  templateUrl: './dyn-form.component.html',
  styleUrls: ['./dyn-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useClass: forwardRef(() => DynFormComponent)
    }
  ]
})
export class DynFormComponent implements OnInit, ControlValueAccessor {

  @Input('data') data;
  @Input() set outval(val) {
    this._val = val;
  }
  @Output() outvalChange = new EventEmitter();

  
  private _val : any;
  public get val() : any {
    return this._val;
  }
  public set val(v : any) {
    this._val = v;
    this.outvalChange.emit(v);
  }

  changeRadioValue(event) {
    this.val = event.target.value;
  }
  
  constructor() { }

  ngOnInit() {
  }

  writeValue(obj: any): void {
    throw new Error("Method not implemented.");
  }
  registerOnChange(fn: any): void {
    throw new Error("Method not implemented.");
  }
  registerOnTouched(fn: any): void {
    throw new Error("Method not implemented.");
  }
  setDisabledState?(isDisabled: boolean): void {
    throw new Error("Method not implemented.");
  }

}

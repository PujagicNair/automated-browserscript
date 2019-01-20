import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddscriptComponent } from './addscript.component';

describe('AddscriptComponent', () => {
  let component: AddscriptComponent;
  let fixture: ComponentFixture<AddscriptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddscriptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

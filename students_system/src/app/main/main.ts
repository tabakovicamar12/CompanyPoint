import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menu } from '../overview/menu/menu';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Menu],
  template: `
    <div class="layout-wrapper">
      <app-menu></app-menu> <div class="content">
        <router-outlet></router-outlet> </div>
    </div>
  `
})
export class MainLayoutComponent { }
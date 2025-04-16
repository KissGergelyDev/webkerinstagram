import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//import { HomeComponent } from './pages/home/home.component';
//import { LoginComponent } from './pages/login/login.component';
//import { MessagesComponent } from './pages/messages/messages.component';
//import { ProfileComponent } from './pages/profile/profile.component';
//import { MenuComponent } from './shared/menu/menu.component';
//import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'webkerinstagram';
}

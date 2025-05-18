import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout',
  template: `
    <div class="logout-container">
      <h2>Kijelentkezés folyamatban</h2>
      <mat-spinner diameter="50" color="white"></mat-spinner>
      <p>Kérjük várakozzon...</p>
    </div>
  `,
  styleUrls: ['./logout.component.scss'],
  standalone: true,
  imports: [MatProgressSpinnerModule, CommonModule]
})
export class LogoutComponent {
  constructor(private router: Router) {
    localStorage.removeItem('isLoggedIn');
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}
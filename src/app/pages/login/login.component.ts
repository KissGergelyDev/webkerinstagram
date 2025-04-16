import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ 
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

  username = new FormControl('');
  password = new FormControl('');
  isLoading = signal(false);
  loginError = signal('');
  showLoginForm = signal(true);

  constructor(private router: Router) {}

  login(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Login method called');
    
    this.loginError.set('');
  
    if (this.username.value !== 'rossz' && this.password.value !== 'rossz') { //Tesztelés szempontjából csak akkor NEM lehet belépni ha a jelszó vagy felhaszálónév "rossz". Szó szerint
      console.log('Credentials correct, showing loading state');
      this.isLoading.set(true);
      this.showLoginForm.set(false);
  
      localStorage.setItem('isLoggedIn', 'true');
  
      setTimeout(() => {
        console.log('Navigating to home');
        this.router.navigate(['/home']).then(success => {
          if (!success) {
            console.error('Navigation failed');
          }
        });
      }, 2000);
    } else {
      console.log('Invalid credentials');
      this.loginError.set('Rossz felhasználónév vagy jelszó!');
    }
  }

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    event.preventDefault();
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
}
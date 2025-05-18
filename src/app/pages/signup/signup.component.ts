import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  providers: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signUpForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rePassword: new FormControl('', [Validators.required]),
  });

  isLoading = signal(false);
  showForm = signal(true);
  signupError = signal('');

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async signup() {
    if (this.signUpForm.invalid) return;
  
    const username = this.signUpForm.get('username')?.value?.trim();
    const email = this.signUpForm.get('email')?.value?.trim();
    const password = this.signUpForm.get('password')?.value;
    const rePassword = this.signUpForm.get('rePassword')?.value;
  
    if (!username || !email || !password || !rePassword) {
      this.signupError.set('Minden mezőt ki kell tölteni!');
      return;
    }
  
    if (password !== rePassword) {
      this.signupError.set('A jelszavak nem egyeznek!');
      return;
    }
  
    this.isLoading.set(true);
  
    try {
      await this.authService.signup(username, email, password);
      this.router.navigateByUrl('/home');
    } catch (error: any) {
      this.signupError.set(error.message || 'Hiba történt a regisztráció során');
      console.error('Signup error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
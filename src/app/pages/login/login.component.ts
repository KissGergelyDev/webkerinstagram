import { ChangeDetectionStrategy, Component, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

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
export class LoginComponent implements OnDestroy {

  email = new FormControl('');
  password = new FormControl('');
  isLoading = signal(false);
  loginError = signal('');
  showLoginForm = signal(true);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async login(event: Event) {
  event.preventDefault();
  this.loginError.set('');

  try {
      this.isLoading.set(true);
      await this.authService.login(this.email.value!, this.password.value!).toPromise();
      this.router.navigate(['/home']);
    } catch (error) {
      this.loginError.set('Invalid credentials');
    } finally {
      this.isLoading.set(false);
    }
  }


  hide = signal(true);
  clickEvent(event: MouseEvent) {
    event.preventDefault();
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  ngOnDestroy() {
    console.log('LoginComponent destroyed');
    this.email.reset();
    this.password.reset();
    this.loginError.set('');
  }
}
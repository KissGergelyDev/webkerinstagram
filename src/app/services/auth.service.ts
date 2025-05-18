import { Injectable } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  user,
  UserCredential 
} from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, switchMap, of, map, tap } from 'rxjs';
import { User } from '../shared/models/User';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<any>;

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.currentUser$ = user(this.auth);
  }

  async signup(username: string, email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      const userId = userCredential.user.uid;
      const userDocRef = doc(this.firestore, 'users', userId);
      
      const userData: User = {
        id: userId,
        username,
        email,
        profilePicture: '' // Alapértelmezett üres profilkép
      };
      
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userData;
      
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Hiba történt a regisztráció során');
    }
  }

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential: UserCredential) => {
        const userId = userCredential.user.uid;
        const userDocRef = doc(this.firestore, 'users', userId);
        return from(getDoc(userDocRef));
      }),
      map(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          localStorage.setItem('user', JSON.stringify(userData));
          return userData;
        } else {
          throw new Error('Felhasználói adatok nem találhatók');
        }
      }),
      tap(() => {
        localStorage.setItem('isLoggedIn', 'true');
      })
    );
  }

  logout(): Observable<void> {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    return from(signOut(this.auth));
  }

  updateUserProfile(userId: string, data: Partial<User>): Observable<void> {
    const userDocRef = doc(this.firestore, 'users', userId);
    return from(updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    }));
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
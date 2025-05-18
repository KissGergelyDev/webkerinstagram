// like.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from '@angular/fire/firestore';
import { from, Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LikeService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getLikesForPost(postId: string): Observable<string[]> {
    const likesCollection = collection(this.firestore, 'likes');
    const q = query(likesCollection, where('postId', '==', postId));

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data()['userId']))
    );
  }

  async toggleLike(postId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Nincs bejelentkezett felhasználó');

    const likeId = `${postId}_${user.id}`;
    const likeDoc = doc(this.firestore, 'likes', likeId);

    // Ellenőrizzük, hogy létezik-e már a like
    const likeSnapshot = await getDoc(likeDoc);

    if (likeSnapshot.exists()) {
      // Ha létezik, töröljük
      await deleteDoc(likeDoc);
    } else {
      // Ha nem létezik, létrehozzuk
      await setDoc(likeDoc, { 
        postId, 
        userId: user.id,
        createdAt: new Date() // Opcionális: időbélyeg hozzáadása
      });
    }
  }
}
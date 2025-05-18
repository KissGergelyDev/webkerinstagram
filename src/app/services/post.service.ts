import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, catchError, switchMap } from 'rxjs';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDocs, 
  where,
  serverTimestamp,
  DocumentReference,
  getDoc,
  QuerySnapshot,
  DocumentData,
  limit
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Post } from '../shared/models/Post';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  // post.service.ts
  getPosts(): Observable<Post[]> {
    const postsCollection = collection(this.firestore, 'posts');
    const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
    
    return from(getDocs(postsQuery)).pipe(
      map((querySnapshot: QuerySnapshot<DocumentData>) => {
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            authorId: data['authorId'],
            imageUrl: data['imageUrl'],
            caption: data['caption'] || '',
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Post;
        });
      }),
      catchError(error => {
        console.error('Error fetching posts:', error);
        return of([]);
      })
    );
  }

  getPostById(postId: string): Observable<Post | null> {
    return from(getDocs(query(
      collection(this.firestore, 'posts'), 
      where('__name__', '==', postId)
    ))).pipe(
      map(querySnapshot => {
        if (querySnapshot.empty) return null;
        
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        // Validate required fields
        if (!data['authorId'] || !data['imageUrl']) {
          console.error('Post is missing required fields');
          return null;
        }
        
        return {
          id: doc.id,
          authorId: data['authorId'], // Now guaranteed to be string
          imageUrl: data['imageUrl'], // Guaranteed to be string
          caption: data['caption'] || '',
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Post;
      }),
      catchError(error => {
        console.error('Error fetching post:', error);
        return of(null);
      })
    );
  }

  async uploadImage(file: File): Promise<string> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Nincs bejelentkezett felhasználó');
    }

    try {
      const timestamp = new Date().getTime();
      const filePath = `posts/${currentUser.id}/${timestamp}_${file.name}`;
      const fileRef = ref(this.storage, filePath);
      
      const uploadTask = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);
      
      return downloadUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Hiba történt a kép feltöltése közben');
    }
  }

  createPost(postData: { imageUrl: string; caption?: string; authorId: string }): Observable<Post> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('Nincs bejelentkezett felhasználó');
    }

    const postsCollection = collection(this.firestore, 'posts');
    const newPost = {
      authorId: postData.authorId,
      imageUrl: postData.imageUrl,
      caption: postData.caption || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    return from(
      addDoc(postsCollection, newPost).then(async (docRef) => {
        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) {
          throw new Error('Nem sikerült létrehozni a posztot');
        }
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          authorId: data['authorId'],
          imageUrl: data['imageUrl'],
          caption: data['caption'] || '',
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        } as Post;
      })
    );
  }

  async updatePost(postId: string, updateData: { caption?: string }): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Nincs bejelentkezett felhasználó');
    }

    try {
      const postDocRef = doc(this.firestore, 'posts', postId);
      
      await updateDoc(postDocRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update post error:', error);
      throw new Error('Hiba történt a poszt frissítése közben');
    }
  }

  async deletePost(postId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Nincs bejelentkezett felhasználó');
    }

    try {
      // Először töröljük a kapcsolódó kommenteket és like-okat
      await this.deletePostComments(postId);
      await this.deletePostLikes(postId);
      
      // Majd töröljük magát a posztot
      const postDocRef = doc(this.firestore, 'posts', postId);
      await deleteDoc(postDocRef);
    } catch (error) {
      console.error('Delete post error:', error);
      throw new Error('Hiba történt a poszt törlése közben');
    }
  }

  // post.service.ts

  async deletePostComments(postId: string): Promise<void> {
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      const commentsQuery = query(commentsCollection, where('postId', '==', postId));
      const querySnapshot = await getDocs(commentsQuery);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting comments:', error);
      throw new Error('Hiba történt a kommentek törlése közben');
    }
  }

  async deletePostLikes(postId: string): Promise<void> {
    try {
      const likesCollection = collection(this.firestore, 'likes');
      const likesQuery = query(likesCollection, where('postId', '==', postId));
      const querySnapshot = await getDocs(likesQuery);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting likes:', error);
      throw new Error('Hiba történt a like-ok törlése közben');
    }
  }

    // post.service.ts

  // Rövid leírású posztok (10 karakternél rövidebb)
  getShortCaptionPosts(): Observable<Post[]> {
    return this.getPosts().pipe(
      map(posts => posts.filter(post => 
        post.caption && post.caption.length > 0 && post.caption.length < 10
      )),
      catchError(error => {
        console.error('Error fetching short caption posts:', error);
        return of([]);
      })
    );
  }

  // Hosszú leírású posztok (10 karakter vagy hosszabb)
  getLongCaptionPosts(): Observable<Post[]> {
    return this.getPosts().pipe(
      map(posts => posts.filter(post => 
        post.caption && post.caption.length >= 10
      )),
      catchError(error => {
        console.error('Error fetching long caption posts:', error);
        return of([]);
      })
    );
  }

  // Posztok legalább 1 like-al
  getLikedPosts(): Observable<Post[]> {
    // Ehhez először lekérjük a like-okat, majd a posztokat
    const likesCollection = collection(this.firestore, 'likes');
    const likesQuery = query(likesCollection);
    
    return from(getDocs(likesQuery)).pipe(
      switchMap(likesSnapshot => {
        const postIds = [...new Set(likesSnapshot.docs.map(doc => doc.data()['postId']))];
        
        if (postIds.length === 0) return of([]);
        
        const postsCollection = collection(this.firestore, 'posts');
        const postsQuery = query(
          postsCollection,
          where('__name__', 'in', postIds.slice(0, 10)), // Firestore max 10 elemre enged 'in' operátort
          orderBy('createdAt', 'desc')
        );
        
        return from(getDocs(postsQuery)).pipe(
          map((querySnapshot: QuerySnapshot<DocumentData>) => this.mapPosts(querySnapshot))
        );
      }),
      catchError(error => {
        console.error('Error fetching liked posts:', error);
        return of([]);
      })
    );
  }

  // Posztok 0 like-al
  getUnlikedPosts(): Observable<Post[]> {
    // Ehhez először lekérjük a like-okat, majd a posztokat
    const likesCollection = collection(this.firestore, 'likes');
    const likesQuery = query(likesCollection);
    
    return from(getDocs(likesQuery)).pipe(
      switchMap(likesSnapshot => {
        const likedPostIds = [...new Set(likesSnapshot.docs.map(doc => doc.data()['postId']))];
        
        const postsCollection = collection(this.firestore, 'posts');
        let postsQuery;
        
        if (likedPostIds.length > 0) {
          postsQuery = query(
            postsCollection,
            where('__name__', 'not-in', likedPostIds.slice(0, 10)), // Firestore max 10 elemre enged 'not-in' operátort
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        } else {
          // Ha nincs like-olva egy poszt sem, akkor minden poszt megfelel
          postsQuery = query(
            postsCollection,
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        }
        
        return from(getDocs(postsQuery)).pipe(
          map((querySnapshot: QuerySnapshot<DocumentData>) => this.mapPosts(querySnapshot))
        );
      }),
      catchError(error => {
        console.error('Error fetching unliked posts:', error);
        return of([]);
      })
    );
  }

  // Segédfüggvény a posztok map-eléséhez
  private mapPosts(querySnapshot: QuerySnapshot<DocumentData>): Post[] {
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        authorId: data['authorId'],
        imageUrl: data['imageUrl'],
        caption: data['caption'] || '',
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
      } as Post;
    });
  }
}
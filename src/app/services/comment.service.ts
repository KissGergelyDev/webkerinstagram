// comment.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { from, Observable, map } from 'rxjs';

export interface Comment {
  id?: string;
  postId: string;
  content: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private firestore: Firestore) {}

  getCommentsForPost(postId: string): Observable<Comment[]> {
    const commentsCollection = collection(this.firestore, 'comments');
    const commentsQuery = query(commentsCollection, where('postId', '==', postId));
    
    return from(getDocs(commentsQuery)).pipe(
      map(querySnapshot => querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          postId: data['postId'],
          content: data['content'],
          createdAt: data['createdAt']?.toDate() || new Date()
        } as Comment;
      }))
    );
  }

  createComment(comment: { postId: string; content: string }): Observable<void> {
    const commentsCollection = collection(this.firestore, 'comments');
    return from(addDoc(commentsCollection, {
      ...comment,
      createdAt: serverTimestamp()
    })).pipe(map(() => {}));
  }
}

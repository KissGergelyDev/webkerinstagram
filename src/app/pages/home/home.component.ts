import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Post } from '../../shared/models/Post';
import { Comment } from '../../shared/models/Comment';
import { TruncatePipe } from '../../shared/models/truncate.pipe';
import { Like } from '../../shared/models/Like';
import { LikeCounterComponent } from './components/like-counter/like-counter.component';

const THUMBUP_ICON =
  `
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.` +
  `44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5` +
  `1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
  </svg>
`;

const COMMENT_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
  </svg>
`;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ 
    MatIconModule, 
    CommonModule, 
    TruncatePipe,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    RouterLink,
    LikeCounterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  posts = signal<Post[]>([]);
  comments = signal<Comment[]>([]);
  likes = signal<Like[]>([]);
  newCommentContent = '';
  activePostId: string | null = null;
  currentUserId = 'user-' + Math.random().toString(36).substring(2, 9); // Véletlen user ID

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    iconRegistry.addSvgIconLiteral('thumbs-up', sanitizer.bypassSecurityTrustHtml(THUMBUP_ICON));
    iconRegistry.addSvgIconLiteral('comment', sanitizer.bypassSecurityTrustHtml(COMMENT_ICON));
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result as string;

      const newPost: Post = {
        id: crypto.randomUUID(),
        authorId: 'dummy-user-id',
        imageUrl: imageUrl,
        createdAt: new Date(),
        caption: 'Imádom a gyerekeket, de nagyon, tehát hogy élek halok értük. Természetesen semmi szexuális dologról nincs szó'
      };

      this.posts.update((prev) => [newPost, ...prev]);
    };

    reader.readAsDataURL(file);
  }

  addComment(postId: string) {
    if (!this.newCommentContent.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      postId: postId,
      authorId: 'anonymous', // ideiglenes
      content: this.newCommentContent,
      createdAt: new Date()
    };

    this.comments.update(prev => [...prev, newComment]);
    this.newCommentContent = ''; // Űrlap ürítése
    this.activePostId = null; // Komment mező bezárása
  }

  getCommentsForPost(postId: string) {
    return this.comments().filter(c => c.postId === postId);
  }

  toggleCommentInput(postId: string) {
    this.activePostId = this.activePostId === postId ? null : postId;
  }

  toggleLike(postId: string) {
    const existingLike = this.likes().find(like => 
      like.postId === postId && like.userId === this.currentUserId
    );

    if (existingLike) {
      // Like eltávolítása
      this.likes.update(likes => likes.filter(like => like.id !== existingLike.id));
    } else {
      // Új like hozzáadása
      const newLike: Like = {
        id: crypto.randomUUID(),
        postId: postId,
        userId: this.currentUserId,
        createdAt: new Date()
      };
      this.likes.update(likes => [...likes, newLike]);
    }
  }

  getLikeCount(postId: string): number {
    return this.likes().filter(like => like.postId === postId).length;
  }

  hasUserLiked(postId: string): boolean {
    return this.likes().some(like => 
      like.postId === postId && like.userId === this.currentUserId
    );
  }
}

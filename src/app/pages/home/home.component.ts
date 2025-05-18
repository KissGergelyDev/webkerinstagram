import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Post } from '../../shared/models/Post';
import { Comment } from '../../shared/models/Comment';
import { Like } from '../../shared/models/Like';
import { TruncatePipe } from '../../shared/models/truncate.pipe';
import { LikeCounterComponent } from './components/like-counter/like-counter.component';
import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { LikeService } from '../../services/like.service';
import { AuthService } from '../../services/auth.service';

const THUMBUP_ICON = 
  `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32
      c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45
      7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5
      1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
  </svg>`;

const COMMENT_ICON = 
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
  </svg>`;

const EDIT_ICON =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`;

const DELETE_ICON =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>`;

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  posts = signal<Post[]>([]);
  comments = signal<Comment[]>([]);
  likes = signal<Like[]>([]);
  newCommentContent = '';
  activePostId: string | null = null;
  editingPostId: string | null = null;
  editedCaption = '';

  private postService = inject(PostService);
  private commentService = inject(CommentService);
  private likeService = inject(LikeService);
  private authService = inject(AuthService);

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    iconRegistry.addSvgIconLiteral('thumbs-up', sanitizer.bypassSecurityTrustHtml(THUMBUP_ICON));
    iconRegistry.addSvgIconLiteral('comment', sanitizer.bypassSecurityTrustHtml(COMMENT_ICON));
    iconRegistry.addSvgIconLiteral('edit', sanitizer.bypassSecurityTrustHtml(EDIT_ICON));
    iconRegistry.addSvgIconLiteral('delete', sanitizer.bypassSecurityTrustHtml(DELETE_ICON));
  }

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe(posts => {
      this.posts.set(posts);
      posts.forEach(post => {
        this.loadComments(post.id);
        this.loadLikes(post.id);
      });
    });
  }

  loadComments(postId: string) {
    this.commentService.getCommentsForPost(postId).subscribe(comments => {
      this.comments.update(all => [
        ...all.filter(c => c.postId !== postId),
        ...comments as Comment[]
      ]);
    });
  }

  loadLikes(postId: string) {
    this.likeService.getLikesForPost(postId).subscribe(userIds => {
      const likeObjs = userIds.map(userId => ({
        postId,
        userId
      })) as Like[];

      this.likes.update(prev => [
        ...prev.filter(like => like.postId !== postId),
        ...likeObjs
      ]);
    });
  }

  toggleCommentInput(postId: string) {
    this.activePostId = this.activePostId === postId ? null : postId;
  }

  addComment(postId: string) {
    if (!this.newCommentContent.trim()) return;

    this.commentService.createComment({
      postId,
      content: this.newCommentContent
    }).subscribe(() => {
      this.newCommentContent = '';
      this.activePostId = null;
      this.loadComments(postId);
    });
  }

  getCommentsForPost(postId: string): Comment[] {
    return this.comments().filter(c => c.postId === postId);
  }

  async toggleLike(postId: string) {
    await this.likeService.toggleLike(postId);
    this.loadLikes(postId);
  }

  getLikeCount(postId: string): number {
    return this.likes().filter(like => like.postId === postId).length;
  }

  hasUserLiked(postId: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    return this.likes().some(like => like.postId === postId && like.userId === currentUser.id);
  }

  async onImageSelected(event: Event) {
    try {
      const imageUrl = 'assets/images/cat.jpg';
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) throw new Error('Nincs bejelentkezett felhasználó');

      const newPostData = {
        imageUrl: imageUrl,
        caption: 'Imádom a gyerekeket...',
        authorId: currentUser.id
      };

      this.postService.createPost(newPostData).subscribe(newPost => {
        if (newPost) {
          this.posts.update(prev => [newPost, ...prev]);
        }
      });
    } catch (error) {
      console.error('Hiba kép feltöltésekor:', error);
    }
  }

  // Új metódusok a poszt szerkesztéséhez és törléséhez
  editPost(post: Post) {
    this.editingPostId = post.id;
    this.editedCaption = post.caption || '';
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editedCaption = '';
  }

  savePostEdit(postId: string) {
    if (!this.editedCaption.trim()) return;

    this.postService.updatePost(postId, { caption: this.editedCaption })
      .then(() => {
        this.posts.update(posts => 
          posts.map(post => 
            post.id === postId 
              ? { ...post, caption: this.editedCaption, updatedAt: new Date() } 
              : post
          )
        );
        this.cancelEdit();
      })
      .catch(error => {
        console.error('Hiba a poszt frissítésekor:', error);
      });
  }

  // home.component.ts

  async deletePost(postId: string) {
    if (confirm('Biztosan törölni szeretnéd ezt a posztot?')) {
      try {
        await this.postService.deletePost(postId);
        
        // Frissítjük a lokális állapotot
        this.posts.update(posts => posts.filter(post => post.id !== postId));
        this.comments.update(comments => comments.filter(c => c.postId !== postId));
        this.likes.update(likes => likes.filter(l => l.postId !== postId));
      } catch (error) {
        console.error('Hiba a poszt törlésekor:', error);
        // Itt lehetne valami felhasználói visszajelzés is
      }
    }
  }

    // home.component.ts

  // Új property a komponensben
  filterType = signal<'all' | 'short' | 'long' | 'liked' | 'unliked'>('all');

  // Új metódusok a szűréshez
  filterShortCaptionPosts() {
    this.filterType.set('short');
    this.postService.getShortCaptionPosts().subscribe(posts => {
      this.posts.set(posts);
      this.loadCommentsAndLikes(posts);
    });
  }

  filterLongCaptionPosts() {
    this.filterType.set('long');
    this.postService.getLongCaptionPosts().subscribe(posts => {
      this.posts.set(posts);
      this.loadCommentsAndLikes(posts);
    });
  }

  filterLikedPosts() {
    this.filterType.set('liked');
    this.postService.getLikedPosts().subscribe(posts => {
      this.posts.set(posts);
      this.loadCommentsAndLikes(posts);
    });
  }

  filterUnlikedPosts() {
    this.filterType.set('unliked');
    this.postService.getUnlikedPosts().subscribe(posts => {
      this.posts.set(posts);
      this.loadCommentsAndLikes(posts);
    });
  }

  resetFilters() {
    this.filterType.set('all');
    this.loadPosts();
  }

  // Segédfüggvény a kommentek és like-ok betöltéséhez
  private loadCommentsAndLikes(posts: Post[]) {
    this.comments.set([]);
    this.likes.set([]);
    
    posts.forEach(post => {
      this.loadComments(post.id);
      this.loadLikes(post.id);
    });
  }

  onHoverStart() {
    console.log('Hover start');
  }

  onHoverEnd() {
    console.log('Hover end');
  }
}
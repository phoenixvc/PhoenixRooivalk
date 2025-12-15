/**
 * Types for Inline Comments
 */

export interface InlineComment {
  id: string;
  pageId: string;
  selectedText: string;
  textContext: string; // Surrounding text for re-locating
  comment: string;
  author: {
    uid: string;
    displayName: string;
    photoURL?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt?: string;
  resolved?: boolean;
  replies?: InlineCommentReply[];
}

export interface InlineCommentReply {
  id: string;
  comment: string;
  author: {
    uid: string;
    displayName: string;
    photoURL?: string;
  };
  createdAt: string;
}

export interface TextSelection {
  text: string;
  context: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

export interface InlineCommentInput {
  pageId: string;
  selectedText: string;
  textContext: string;
  comment: string;
}

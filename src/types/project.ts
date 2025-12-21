// 書類データの型定義
export interface Document {
  id: string;
  title: string;
  url: string;
  tags: string[];
  created_at: string;
}

// タグデータの型定義
export interface CustomTag {
  id: string;
  name: string;
}
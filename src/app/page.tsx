'use client';

import { useState } from 'react';

// メモ1件分のデータの形
interface Memo {
  id: number;
  project: string;
  tag: string;
  content: string;
  url: string;
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 入力フォームの状態
  const [project, setProject] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');

  // 保存ボタンを押した時の処理
  const handleSave = () => {
    if (!project || !content) {
      alert("案件名と内容は必須です！");
      return;
    }
    const newMemo: Memo = {
      id: Date.now(),
      project,
      tag,
      content,
      url
    };
    setMemos([newMemo, ...memos]);
    // 入力欄をクリア
    setProject(''); setTag(''); setContent(''); setUrl('');
  };

  // 検索条件に合うメモだけを絞り込む
  const filteredMemos = memos.filter(memo => 
    memo.project.includes(searchQuery) || 
    memo.tag.includes(searchQuery) || 
    memo.content.includes(searchQuery)
  );

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fdfdfd' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>おもいやり情報ハブ（α版）</h1>
      
      {/* --- 入力エリア --- */}
      <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h3>🚀 新しい決定事項・リンクを登録</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input placeholder="案件名 (例: A社サイト改修)" value={project} onChange={e => setProject(e.target.value)} style={inputStyle} />
          <input placeholder="タグ (例: 決定事項, 設計, LINE)" value={tag} onChange={e => setTag(e.target.value)} style={inputStyle} />
          <textarea placeholder="内容・メモ" value={content} onChange={e => setContent(e.target.value)} style={{ ...inputStyle, height: '80px' }} />
          <input placeholder="参考URL (https://...)" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          <button onClick={handleSave} style={buttonStyle}>情報を集約する</button>
        </div>
      </section>

      {/* --- 検索エリア --- */}
      <section style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 案件、タグ、内容で検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, borderColor: '#0070f3', borderWidth: '2px' }}
        />
      </section>

      {/* --- 表示エリア --- */}
      <section>
        {filteredMemos.map(memo => (
          <div key={memo.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={projectBadgeStyle}>{memo.project}</span>
              <span style={tagBadgeStyle}>{memo.tag}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color
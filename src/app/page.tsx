'use client';

import { useState, useEffect } from 'react';

interface Doc {
  id: number;
  title: string;
  type: string; // PDF, パワポ, Docs
  tags: string[]; // 独自タグ（複数）
  url: string;
  memo: string;
  createdAt: number; // 並び替え用
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'title'>('date'); // 並び替え状態

  // 入力フォーム
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PDF');
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('doc_hub_data');
    if (saved) setDocs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('doc_hub_data', JSON.stringify(docs));
  }, [docs]);

  const handleSave = () => {
    if (!title || !url) return alert("タイトルとURLは必須です");
    const newDoc: Doc = {
      id: Date.now(),
      title,
      type,
      tags: tagInput.split(',').map(t => t.trim()).filter(t => t !== ''),
      url,
      memo,
      createdAt: Date.now(),
    };
    setDocs([newDoc, ...docs]);
    setTitle(''); setTagInput(''); setUrl(''); setMemo('');
  };

  const handleDelete = (id: number) => {
    if (confirm('削除しますか？')) setDocs(docs.filter(d => d.id !== id));
  };

  // 並び替えと検索のロジック
  const displayDocs = docs
    .filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.tags.some(t => t.includes(searchQuery))
    )
    .sort((a, b) => {
      if (sortBy === 'date') return b.createdAt - a.createdAt;
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ fontSize: '2rem', borderBottom: '2px solid #333', paddingBottom: '10px' }}>📁 資料外付けタグ管理システム</h1>

      {/* --- 入力エリア --- */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0 }}>📌 新規資料登録</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <input placeholder="資料タイトル (例: A社要件定義書)" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            <option value="PDF">📕 PDF</option>
            <option value="PowerPoint">📙 PowerPoint</option>
            <option value="Google Docs">📘 Google Docs/Sheets</option>
            <option value="Excel/Word">📗 Excel/Word</option>
            <option value="Other">📂 その他</option>
          </select>
          <input placeholder="タグをカンマ区切りで入力 (例: 重要, 2024, 確定)" value={tagInput} onChange={e => setTagInput(e.target.value)} style={inputStyle} />
          <input placeholder="資料のURL (Google Driveのリンクなど)" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          <textarea placeholder="補足メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, gridColumn: '1 / span 2', height: '60px' }} />
        </div>
        <button onClick={handleSave} style={buttonStyle}>資料をインデックスに追加</button>
      </section>

      {/* --- 操作エリア --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <input 
          placeholder="🔍 タイトルやタグで検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '10px', width: '60%', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <div>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>並び替え:</span>
          <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '5px' }}>
            <option value="date">日付順</option>
            <option value="type">種類順</option>
            <option value="title">五十音順</option>
          </select>
        </div>
      </div>

      {/* --- 表示エリア --- */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {displayDocs.map(doc => (
          <div key={doc.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={typeBadgeStyle(doc.type)}>{doc.type}</span>
              <button onClick={() => handleDelete(doc.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}>削除</button>
            </div>
            <h4 style={{ margin: '10px 0' }}>{doc.title}</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {doc.tags.map((tag, i) => (
                <span key={i} style={tagStyle}>#{tag}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>{doc.memo}</p>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>🔗 資料を開く</a>
          </div>
        ))}
      </div>
    </main>
  );
}

// スタイル
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' };
const buttonStyle = { marginTop: '15px', padding: '12px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' };
const cardStyle = { padding: '20px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const tagStyle = { backgroundColor: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' };
const linkButtonStyle = { display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: '#1890ff', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' };
const typeBadgeStyle = (type: string) => {
  const colors: any = { 'PDF': '#ff4d4f', 'PowerPoint': '#fa8c16', 'Google Docs': '#1890ff', 'Excel/Word': '#52c41a' };
  return { backgroundColor: colors[type] || '#8c8c8c', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
};
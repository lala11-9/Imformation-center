'use client';

import { useState } from 'react';

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
  
  const [project, setProject] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');

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
    setProject(''); setTag(''); setContent(''); setUrl('');
  };

  const filteredMemos = memos.filter(memo => 
    memo.project.toLowerCase().includes(searchQuery.toLowerCase()) || 
    memo.tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
    memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fdfdfd' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>おもいやり情報ハブ（α版）</h1>
      
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

      <section style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 案件、タグ、内容で検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, borderColor: '#0070f3', borderWidth: '2px' }}
        />
      </section>

      <section>
        {filteredMemos.map(memo => (
          <div key={memo.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={projectBadgeStyle}>{memo.project}</span>
              <span style={tagBadgeStyle}>{memo.tag}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: '#080707ff' }}>{memo.content}</p>
            {memo.url && (
              <a href={memo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', fontSize: '0.9rem' }}>
                🔗 関連リンクへ飛ぶ
              </a>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

// --- デザインの設定（ここを強化しました！） ---
const inputStyle = { 
  padding: '12px', 
  borderRadius: '8px', 
  border: '2px solid #cbd5e1', // 枠線を少し太く、見やすく
  fontSize: '1rem', 
  fontWeight: '600', // 文字を太く
  color: '#1e293b',  // 文字色をかなり濃いグレーに
  backgroundColor: '#f8fafc', // 入力欄の中をほんのり明るいグレーに
  outline: 'none'
};

const buttonStyle = { 
  padding: '14px', 
  backgroundColor: '#0f172a', // ボタンを濃い紺色にして引き締める
  color: '#fff', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: 'bold',
  fontSize: '1.1rem',
  marginTop: '10px'
};

const cardStyle = { 
  backgroundColor: '#fff', 
  padding: '20px', 
  borderRadius: '12px', 
  borderLeft: '8px solid #3b82f6', // 左端の線を太く
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', 
  marginBottom: '20px' 
};

const projectBadgeStyle = { 
  backgroundColor: '#dbeafe', 
  color: '#1e40af', // 濃い青
  padding: '4px 12px', 
  borderRadius: '6px', 
  fontSize: '0.9rem', 
  fontWeight: '800' // 超太字
};

const tagBadgeStyle = { 
  backgroundColor: '#f1f5f9', 
  color: '#475569', // 濃いグレー
  padding: '4px 12px', 
  borderRadius: '6px', 
  fontSize: '0.9rem',
  fontWeight: '600'
};
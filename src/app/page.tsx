'use client';

import { useState, useEffect } from 'react';

interface Doc {
  id: number;
  title: string;
  tags: string[];
  url: string;
  memo: string;
  createdAt: string;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('すべて');
  
  // タグ管理用のステート
  const [customTags, setCustomTags] = useState<string[]>(['Web攻撃', 'ネットワーク', '重要']);
  const [newTagName, setNewTagName] = useState('');

  // 資料登録用のステート
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // 初期読み込み
  useEffect(() => {
    const savedDocs = localStorage.getItem('team_docs_v3');
    const savedTags = localStorage.getItem('team_tags_v3');
    if (savedDocs) setDocs(JSON.parse(savedDocs));
    if (savedTags) {
      const parsedTags = JSON.parse(savedTags);
      setCustomTags(parsedTags);
      setSelectedTag(parsedTags[0] || '');
    } else {
      setSelectedTag(customTags[0]);
    }
  }, []);

  // 保存
  useEffect(() => {
    localStorage.setItem('team_docs_v3', JSON.stringify(docs));
    localStorage.setItem('team_tags_v3', JSON.stringify(customTags));
  }, [docs, customTags]);

  // タグ追加
  const addTag = () => {
    if (!newTagName || customTags.includes(newTagName)) return;
    const updatedTags = [...customTags, newTagName];
    setCustomTags(updatedTags);
    setNewTagName('');
    if (!selectedTag) setSelectedTag(newTagName);
  };

  // タグ削除
  const deleteTag = (tagToDelete: string) => {
    if (confirm(`タグ「${tagToDelete}」を削除しますか？`)) {
      const updatedTags = customTags.filter(t => t !== tagToDelete);
      setCustomTags(updatedTags);
      if (selectedTag === tagToDelete) setSelectedTag(updatedTags[0] || '');
    }
  };

  const handleSave = () => {
    if (!title) return;
    const newDoc: Doc = {
      id: Date.now(),
      title,
      tags: [selectedTag],
      url,
      memo,
      createdAt: new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date()),
    };
    setDocs([newDoc, ...docs]);
    setTitle(''); setUrl(''); setMemo('');
  };

  const filteredDocs = docs.filter(d => {
    const matchesQuery = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.memo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedFilterTag === 'すべて' || d.tags.includes(selectedFilterTag);
    return matchesQuery && matchesTag;
  });

  return (
    <main style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#37352f' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px' }}>💾 security knowledge</h1>

      {/* --- タグの管理セクション --- */}
      <details style={{ marginBottom: '20px', backgroundColor: '#fdfcfb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#666' }}>⚙️ タグの管理（追加・削除）</summary>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {customTags.map(tag => (
            <span key={tag} style={{ ...tagBadgeStyle(tag), display: 'flex', alignItems: 'center', gap: '5px' }}>
              {tag}
              <button onClick={() => deleteTag(tag)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff4d4f', padding: '0 2px' }}>×</button>
            </span>
          ))}
          <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
            <input placeholder="新しいタグ名" value={newTagName} onChange={e => setNewTagName(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            <button onClick={addTag} style={{ padding: '4px 12px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>追加</button>
          </div>
        </div>
      </details>

      {/* --- 資料登録フォーム --- */}
      <div style={{ backgroundColor: '#f7f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #edece9', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="資料名" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={notionInputStyle}>
            {customTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="一言メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...notionInputStyle, flex: 1 }} />
          <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 30px', cursor: 'pointer', fontWeight: '600' }}>追加</button>
        </div>
      </div>

      {/* --- 検索 & フィルター --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
        <select value={selectedFilterTag} onChange={e => setSelectedFilterTag(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <option value="すべて">🏷️ すべてのタグ</option>
          {customTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {/* --- テーブル表示 --- */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#666', textAlign: 'left', fontSize: '12px', borderBottom: '1px solid #eee' }}>
            <th style={thStyle}>Aa 名前</th>
            <th style={thStyle}>⋮≡ Tag</th>
            <th style={thStyle}>📝 一言メモ</th>
            <th style={thStyle}>🕒 作成日時</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocs.map(doc => (
            <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}><a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#37352f' }}>📄 {doc.title}</a></td>
              <td style={tdStyle}><span style={tagBadgeStyle(doc.tags[0])}>{doc.tags[0]}</span></td>
              <td style={tdStyle}>{doc.memo}</td>
              <td style={{ ...tdStyle, color: '#666', fontSize: '12px' }}>{doc.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const notionInputStyle = { border: '1px solid #ddd', padding: '10px', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' };
const thStyle = { padding: '12px 10px' };
const tdStyle = { padding: '12px 10px' };
const tagBadgeStyle = (tag: string) => ({
  backgroundColor: tag === 'Web攻撃' ? '#d3e5ef' : tag === 'ネットワーク' ? '#ffedeb' : '#eee',
  color: tag === 'Web攻撃' ? '#2383e2' : tag === 'ネットワーク' ? '#eb5757' : '#37352f',
  padding: '2px 8px', borderRadius: '3px', fontSize: '12px'
});
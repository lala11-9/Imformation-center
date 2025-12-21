'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル定義（コードの外に出してスッキリさせました） ---
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const secondaryButtonStyle: React.CSSProperties = { padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' };
const deleteButtonStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', color: '#444' };
const smallSelectStyle: React.CSSProperties = { padding: '5px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white' };
const cellStyle: React.CSSProperties = { padding: '12px', textAlign: 'left' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // データ用
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  
  // 入力フォーム用
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // 検索・並び替え用
  const [filterTag, setFilterTag] = useState('すべて');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchData();
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    const { data: docsData } = await supabase.from('documents').select('*');
    if (docsData) setDocs(docsData);

    const { data: tagsData } = await supabase.from('custom_tags').select('name');
    if (tagsData) {
      const names = tagsData.map(t => t.name);
      setCustomTags(names);
      if (names.length > 0) setSelectedTag(names[0]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログイン失敗: ' + error.message);
    else window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName }]);
    if (error) alert('タグの追加に失敗しました。');
    else {
      setNewTagName('');
      await fetchData();
    }
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) {
      alert('書類名とタグを入力してください');
      return;
    }
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url }]);
    if (!error) {
      setTitle('');
      setUrl('');
      await fetchData();
      alert('保存しました！');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) await fetchData();
  };

  // --- 表示用のデータ加工（検索・ソート） ---
  const displayDocs = docs
    .filter(doc => filterTag === 'すべて' || (doc.tags && doc.tags.includes(filterTag)))
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

  // --- ログイン画面 ---
  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>📁 書類集積所</h1>
          <input type="email" placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%' }}>ログイン</button>
        </form>
      </main>
    );
  }

  // --- メイン画面 ---
  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>📁 書類集積所</h1>
        <button onClick={handleLogout} style={secondaryButtonStyle}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        {/* 左カラム：管理 */}
        <aside>
          <div style={sideSectionStyle}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>🏷️ タグを追加</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="タグ名" style={inputStyle} />
              <button onClick={handleAddTag} style={buttonStyle}>追加</button>
            </div>
          </div>

          <div style={sideSectionStyle}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>📄 書類を登録</h3>
            <label style={{ fontSize: '12px', color: '#666' }}>タイトル</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <label style={{ fontSize: '12px', color: '#666' }}>タグ</label>
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              {customTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ fontSize: '12px', color: '#666' }}>URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>保存する</button>
          </div>
        </aside>

        {/* 右カラム：表示 */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>🔍 絞り込み:</span>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={smallSelectStyle}>
                <option value="すべて">すべてのタグ</option>
                {customTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>🔃 並び替え:</span>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={smallSelectStyle}>
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
                <option value="title">五十音順</option>
              </select>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={cellStyle}>書類名</th>
                <th style={cellStyle}>タグ</th>
                <th style={cellStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={cellStyle}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2', fontWeight: 'bold', textDecoration: 'none' }}>{doc.title}</a>
                  </td>
                  <td style={cellStyle}><span style={tagBadgeStyle}>{doc.tags?.[0]}</span></td>
                  <td style={cellStyle}>
                    <button onClick={() => handleDeleteDoc(doc.id)} style={deleteButtonStyle}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
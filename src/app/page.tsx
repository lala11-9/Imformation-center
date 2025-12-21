'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル定義 ---
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const secondaryButtonStyle: React.CSSProperties = { padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' };
const deleteButtonStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '11px' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', color: '#444' };
const smallSelectStyle: React.CSSProperties = { padding: '5px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white' };
const cellStyle: React.CSSProperties = { padding: '12px', textAlign: 'left' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string}[]>([]); // idも保持するように変更
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');

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

    const { data: tagsData } = await supabase.from('custom_tags').select('id, name');
    if (tagsData) {
      setCustomTags(tagsData);
      if (tagsData.length > 0 && !selectedTag) setSelectedTag(tagsData[0].name);
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
    else { setNewTagName(''); await fetchData(); }
  };

  // --- タグの削除機能 ---
  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`タグ「${name}」を削除しますか？このタグが付いている書類は「タグなし」の状態になります。`)) return;
    const { error } = await supabase.from('custom_tags').delete().eq('id', id);
    if (error) alert('タグの削除に失敗しました。');
    else await fetchData();
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('入力が不足しています');
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url }]);
    if (!error) { setTitle(''); setUrl(''); await fetchData(); }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const displayDocs = docs
    .filter(doc => filterTag === 'すべて' || (doc.tags && doc.tags.includes(filterTag)))
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

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

  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>📁 書類集積所</h1>
        <button onClick={handleLogout} style={secondaryButtonStyle}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        <aside>
          {/* タグ管理セクション */}
          <div style={sideSectionStyle}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>🏷️ タグ管理</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ名" style={inputStyle} />
              <button onClick={handleAddTag} style={buttonStyle}>追加</button>
            </div>
            {/* タグ一覧と削除ボタン */}
            <div style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
              {customTags.map(tag => (
                <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '13px' }}>
                  <span>{tag.name}</span>
                  <button onClick={() => handleDeleteTag(tag.id, tag.name)} style={{ ...deleteButtonStyle, padding: '2px 5px' }}>消す</button>
                </div>
              ))}
            </div>
          </div>

          <div style={sideSectionStyle}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>📄 書類を登録</h3>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>書類を保存</button>
          </div>
        </aside>

        <section>
          {/* 検索・並び替え */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px' }}>🔍 絞り込み:</span>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={smallSelectStyle}>
                <option value="すべて">すべてのタグ</option>
                {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px' }}>🔃 並び替え:</span>
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
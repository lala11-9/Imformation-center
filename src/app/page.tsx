'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 資料管理用のステート ---
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // 1. ログイン状態のチェック
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchData();
      setLoading(false);
    };
    checkUser();
  }, []);

  // 2. データの取得
  const fetchData = async () => {
    const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (docsData) setDocs(docsData);

    const { data: tagsData } = await supabase.from('custom_tags').select('name');
    if (tagsData) {
      const names = tagsData.map(t => t.name);
      setCustomTags(names);
      if (names.length > 0) setSelectedTag(names[0]);
    }
  };

  // 3. ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('ログイン失敗: ' + error.message);
    } else {
      window.location.reload(); // ログイン成功で画面更新
    }
  };

  // 4. ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 5. 保存処理
  const handleSave = async () => {
    if (!title) return;
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url, memo }]);
    if (!error) {
      setTitle(''); setUrl(''); setMemo('');
      fetchData();
      alert('保存しました！');
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

  // --- ログインしていない時の画面 ---
  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f7f6f3' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>📁 書類集積所 ログイン</h1>
          <input type="email" placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>ログイン</button>
        </form>
      </main>
    );
  }

  // --- ログインしている時のメイン画面 ---
  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📁 書類集積所</h1>
        <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' }}>ログアウト</button>
      </div>

      {/* 登録エリア */}
      <div style={{ backgroundColor: '#f1f1f1', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="書類名" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
            {customTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={handleSave} style={buttonStyle}>保存する</button>
      </div>

      {/* リスト表示 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>書類名</th>
            <th style={{ padding: '10px' }}>タグ</th>
            <th style={{ padding: '10px' }}>リンク</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(doc => (
            <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{doc.title}</td>
              <td style={{ padding: '10px' }}>{doc.tags?.[0]}</td>
              <td style={{ padding: '10px' }}><a href={doc.url} target="_blank">開く</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' as any };
const buttonStyle = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' };
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// スタイル定義
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const activeTabStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#1e293b', flex: 1 };
const inactiveTabStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#e2e8f0', color: '#64748b', flex: 1 };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', color: '#444' };
const knowledgeTypeBadge = (type: string) => ({ backgroundColor: type === 'ナレッジ' ? '#dbeafe' : '#fef3c7', color: type === 'ナレッジ' ? '#1e40af' : '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' as const });

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string}[]>([]);
  
  // 入力フォームの状態
  const [regMode, setRegMode] = useState<'mini' | 'full' | 'url'>('url'); // モード切替
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [filterTag, setFilterTag] = useState('すべて');

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
    const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
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

  // ナレッジ保存処理
  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    
    // モードに合わせて保存データを調整
    const saveData = {
      title,
      tags: [selectedTag],
      url: regMode === 'mini' ? '' : url,
      memo: memo,
      // titleの頭に種別を付けて保存（後で表示分けしやすくするため）
      category: regMode === 'mini' ? 'ミニ' : regMode === 'full' ? 'ナレッジ' : '書類'
    };

    const { error } = await supabase.from('documents').insert([saveData]);
    if (!error) {
      setTitle(''); setUrl(''); setMemo(''); 
      await fetchData(); 
      alert('登録しました！');
    }
  };

  // テンプレートセット
  const setTemplate = (mode: 'mini' | 'full') => {
    setRegMode(mode);
    setMemo("【Q】\n\n【A】");
    if (mode === 'mini') setTitle('ミニナレッジ: ');
    else setTitle('ナレッジ: ');
  };

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>📁 書類・ナレッジ集積所</h1>
          <input type="email" placeholder="ID (Email)" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%' }}>ログイン</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>📁 書類・ナレッジ集積所</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ padding: '5px 10px', borderRadius: '4px' }}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        <aside>
          {/* 登録セクション */}
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>💎 新規登録</h3>
            
            {/* モード切替タブ */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <button onClick={() => setRegMode('url')} style={regMode === 'url' ? activeTabStyle : inactiveTabStyle}>URL</button>
              <button onClick={() => setTemplate('mini')} style={regMode === 'mini' ? activeTabStyle : inactiveTabStyle}>ミニ</button>
              <button onClick={() => setTemplate('full')} style={regMode === 'full' ? activeTabStyle : inactiveTabStyle}>ガッツリ</button>
            </div>

            <input placeholder="タイトル (または質問)" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>

            {(regMode === 'url' || regMode === 'full') && (
              <input placeholder="参考URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            )}

            <textarea 
              placeholder={regMode === 'url' ? "メモ" : "Q&A形式で入力"} 
              value={memo} 
              onChange={e => setMemo(e.target.value)} 
              style={{ ...inputStyle, height: '120px', resize: 'none' }} 
            />
            
            <button onClick={handleSave} style={{ ...buttonStyle, width: '100%' }}>
              {regMode === 'url' ? '書類を保存' : 'ナレッジを資産化'}
            </button>
          </div>

          {/* タグ管理 */}
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '14px' }}>🏷️ タグ追加</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={inputStyle} />
              <button onClick={async () => {
                await supabase.from('custom_tags').insert([{ name: newTagName }]);
                setNewTagName(''); fetchData();
              }} style={buttonStyle}>＋</button>
            </div>
          </div>
        </aside>

        {/* 表示セクション */}
        <section>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '5px' }}>
              <option value="すべて">すべてのタグ</option>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <span style={{ fontSize: '14px', color: '#666' }}>蓄積数: {docs.length} 件</span>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {docs.filter(d => filterTag === 'すべて' || d.tags?.includes(filterTag)).map(doc => (
              <div key={doc.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={tagBadgeStyle}>{doc.tags?.[0]}</span>
                    {/* タイトルに「ミニ」などの文字が含まれていたらバッジを表示 */}
                    {doc.title.includes('ミニ') && <span style={knowledgeTypeBadge('ミニ')}>ミニナレッジ</span>}
                    {doc.title.includes('ナレッジ:') && <span style={knowledgeTypeBadge('ナレッジ')}>ナレッジ</span>}
                  </div>
                </div>
                
                <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a>
                  ) : (
                    <span>{doc.title}</span>
                  )}
                </h2>

                <p style={{ fontSize: '14px', color: '#444', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
                  {doc.memo}
                </p>
                
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <button onClick={async () => {
                    if(confirm('削除しますか？')) {
                      await supabase.from('documents').delete().eq('id', doc.id);
                      fetchData();
                    }
                  }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>削除</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
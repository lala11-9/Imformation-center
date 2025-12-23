'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル ---
const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderLeft: '4px solid #2383e2', paddingLeft: '10px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  
  // 入力用（書類/ナレッジ共通）
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('非公開');
  
  // 検索用
  const [searchQuery, setSearchQuery] = useState('');

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
    const { data: d } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (d) setDocs(d);
    const { data: t } = await supabase.from('custom_tags').select('*');
    if (t) setCustomTags(t);
  };

  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const typeLabel = inputMode === '書類' ? '📄書類' : '💡ナレッジ';
    const finalTags = inputMode === '書類' ? [selectedTag, visibility] : [selectedTag];
    
    const { error } = await supabase.from('documents').insert([{
      title: `${typeLabel}: ${title}`,
      tags: finalTags,
      url: inputMode === '書類' ? url : '',
      memo: memo
    }]);

    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(''); fetchData();
    }
  };

  // 検索フィルタリング
  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <form onSubmit={(e) => { e.preventDefault(); supabase.auth.signInWithPassword({ email, password }).then(() => window.location.reload()); }} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '320px' }}>
          <h2 style={{ textAlign: 'center' }}>ログイン</h2>
          <input type="email" placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginTop: '10px' }} />
          <button type="submit" style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>ログイン</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fbfcfd' }}>
      
      {/* 1. 入力エリア（上部に配置） */}
      <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setInputMode('書類'); setMemo(''); }} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#e2e8f0', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類を登録</button>
          <button onClick={() => { setInputMode('ナレッジ'); setMemo("【Q】\n\n【A】"); }} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#e2e8f0', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジを登録</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                <option value="">タグを選択</option>
                {customTags.filter(t => inputMode === '書類' ? t.type === '書類' : t.type === 'ナレッジ').map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              {inputMode === '書類' && (
                <select value={visibility} onChange={e => setVisibility(e.target.value)} style={inputStyle}>
                  <option value="一般公開">🌍 一般</option>
                  <option value="限定公開">👥 限定</option>
                  <option value="非公開">🔒 非公開</option>
                </select>
              )}
            </div>
            {inputMode === '書類' && <input placeholder="URLをペースト" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginTop: '10px' }} />}
          </div>
          <div>
            <textarea placeholder="内容・詳細メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: inputMode === '書類' ? '85px' : '130px', resize: 'none' }} />
            <button onClick={handleSave} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>資産として保存する</button>
          </div>
        </div>
      </section>

      {/* 2. 検索・表示エリア */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📚 蓄積データ一覧</h2>
          <input 
            placeholder="🔍 キーワード、タグ、内容で検索..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ ...inputStyle, width: '300px', backgroundColor: '#fff' }} 
          />
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredDocs.length > 0 ? filteredDocs.map(doc => (
            <div key={doc.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {doc.tags?.map((t: string) => (
                    <span key={t} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 10px 0' }}>
                {doc.url ? <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a> : doc.title}
              </h3>
              <div style={{ fontSize: '14px', color: '#475569', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                {doc.memo}
              </div>
            </div>
          )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>該当するデータが見つかりません</p>}
        </div>
      </section>
    </main>
  );
}
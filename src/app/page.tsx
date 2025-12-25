'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル設定 ---
const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', position: 'relative', marginBottom: '15px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類'); // 入力切替
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState(''); // URL機能
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false); // タグ管理
  const [displayTab, setDisplayTab] = useState<'すべて' | '書類' | 'ナレッジ'>('すべて'); // 並び替え・表示切替
  const [searchQuery, setSearchQuery] = useState(''); // 検索機能

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    // 並び替え（作成順）が含まれています
    const { data: d } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (d) setDocs(d);
    const { data: t } = await supabase.from('custom_tags').select('*').order('name');
    if (t) setCustomTags(t);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  // D&D機能・URL発行
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('files').getPublicUrl(fileName);
      setUrl(data.publicUrl); 
      if (!title) setTitle(file.name);
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグを選択してください');
    const { error } = await supabase.from('documents').insert([{
      title, url, memo, 
      // 並び替え/フィルタリング用の隠しタグを付与
      tags: [selectedTag, inputMode === '書類' ? 'type:doc' : 'type:knowledge']
    }]);
    if (!error) { setTitle(''); setUrl(''); setMemo(''); setSelectedTag(''); fetchData(); alert('保存完了'); }
  };

  // タグ追加・削除
  const handleAddTag = async () => {
    if (!newTagName) return;
    await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    setNewTagName(''); fetchData();
  };

  const handleDeleteTag = async (id: any) => {
    if (confirm('削除しますか？')) { await supabase.from('custom_tags').delete().eq('id', id); fetchData(); }
  };

  const handleDeleteDoc = async (id: any) => {
    if (confirm('削除しますか？')) { await supabase.from('documents').delete().eq('id', id); fetchData(); }
  };

  if (!user) {
    return (
      <div style={{ padding: '100px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2>🔐 ナレッジ・バンク</h2>
        <input placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
        <input type="password" placeholder="パス" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
        <button onClick={handleLogin} style={{ ...buttonStyle, width: '100%' }}>ログイン</button>
      </div>
    );
  }

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>🏦 ナレッジ・バンク</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ ...buttonStyle, backgroundColor: '#ef4444' }}>ログアウト</button>
      </div>

      {/* 入力モード切替 */}
      <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #ddd', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setInputMode('書類')} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => setInputMode('ナレッジ')} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
            
            {/* URL入力欄（D&D・手動入力兼用） */}
            <input placeholder="ファイルURL (PDFドロップで自動入力)" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginBottom: '10px', fontSize: '12px', color: '#666' }} />
            
            {/* D&Dエリア */}
            {inputMode === '書類' && (
              <div 
                onDragOver={e => e.preventDefault()} 
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFileUpload(e.dataTransfer.files[0]); }}
                style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundColor: url ? '#f0fdf4' : '#f9f9f9', marginBottom: '10px' }}
              >
                {uploading ? 'アップロード中...' : url ? '✅ 準備完了' : '📁 PDFをドロップ'}
              </div>
            )}

            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              <option value="">タグを選択</option>
              {customTags.filter(t => t.type === inputMode).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>

            {/* タグ追加・削除 */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={inputStyle} />
              <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b' }}>追加</button>
            </div>
            <button onClick={() => setIsTagEditMode(!isTagEditMode)} style={{ fontSize: '12px', color: '#2383e2', border: 'none', background: 'none', cursor: 'pointer', marginTop: '5px' }}>
              {isTagEditMode ? '完了' : '⚙️ タグを整理'}
            </button>
            {isTagEditMode && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '5px' }}>
                {customTags.filter(t => t.type === inputMode).map(t => (
                  <span key={t.id} style={{ fontSize: '11px', background: 'white', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {t.name} <button onClick={() => handleDeleteTag(t.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <textarea placeholder="メモ・内容を入力" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '170px' }} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>データベースに保存</button>
          </div>
        </div>
      </section>

      {/* 検索・並び替え（フィルタリング）セクション */}
      <div style={{ marginBottom: '20px' }}>
        <input placeholder="🔍 検索（タイトル、内容、タグ）" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, padding: '12px' }} />
      </div>
      
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        {['すべて', '書類', 'ナレッジ'].map(t => (
          <button key={t} onClick={() => setDisplayTab(t as any)} style={{ border: 'none', background: 'none', color: displayTab === t ? '#2383e2' : '#64748b', fontWeight: 'bold', borderBottom: displayTab === t ? '2px solid #2383e2' : 'none', cursor: 'pointer', padding: '10px' }}>{t}</button>
        ))}
      </div>

      {/* 一覧表示（検索 & 並び替えロジック適用） */}
      {docs.filter(d => {
        const tabMatch = displayTab === 'すべて' || (displayTab === '書類' && d.tags?.includes('type:doc')) || (displayTab === 'ナレッジ' && d.tags?.includes('type:knowledge'));
        const searchMatch = d.title.includes(searchQuery) || d.memo.includes(searchQuery) || d.tags?.some((t:any) => t.includes(searchQuery));
        return tabMatch && searchMatch;
      }).map(doc => (
        <div key={doc.id} style={cardStyle}>
          <button onClick={() => handleDeleteDoc(doc.id)} style={{ position: 'absolute', right: '10px', top: '10px', border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}>削除</button>
          <h3 style={{ margin: '0 0 5px 0' }}>
            {/* リンク機能：URLがあれば青いリンク、なければ電球アイコン */}
            {doc.url ? (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2', textDecoration: 'none' }}>📄 {doc.title}</a>
            ) : (
              `💡 ${doc.title}`
            )}
          </h3>
          <p style={{ fontSize: '14px', color: '#444', whiteSpace: 'pre-wrap' }}>{doc.memo}</p>
          <div style={{ marginTop: '8px' }}>
            <small style={{ color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
              #{doc.tags?.find((t:string) => !t.startsWith('type:'))}
            </small>
          </div>
        </div>
      ))}
    </main>
  );
}
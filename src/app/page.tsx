'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', position: 'relative', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類');
  
  // 入力用（Q&A用を追加）
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [displayTab, setDisplayTab] = useState<'すべて' | '書類' | 'ナレッジ'>('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    const { data: d } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (d) setDocs(d);
    const { data: t } = await supabase.from('custom_tags').select('*').order('name');
    if (t) setCustomTags(t);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const fileExtension = file.name.split('.').pop();
      const safeFileName = `${Date.now()}.${fileExtension}`;
      const { error: uploadError } = await supabase.storage.from('files').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('files').getPublicUrl(safeFileName);
      setUrl(data.publicUrl); 
      if (!title) setTitle(file.name);
      alert("ファイルを受理しました");
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグを選択してください');
    
    // 保存するときにQ&Aを合体させる
    const finalMemo = inputMode === 'ナレッジ' ? `Q: ${question}\nA: ${answer}` : memo;

    const { error } = await supabase.from('documents').insert([{
      title, url, memo: finalMemo, tags: [selectedTag, inputMode === '書類' ? 'type:doc' : 'type:knowledge']
    }]);
    
    if (!error) { 
      setTitle(''); setUrl(''); setMemo(''); setQuestion(''); setAnswer(''); setSelectedTag(''); 
      fetchData(); alert('保存しました'); 
    }
  };

  const handleDeleteDoc = async (id: any) => {
    if (confirm('削除しますか？')) { await supabase.from('documents').delete().eq('id', id); fetchData(); }
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    setNewTagName(''); fetchData();
  };

  const handleDeleteTag = async (id: any) => {
    if (confirm('削除しますか？')) { await supabase.from('custom_tags').delete().eq('id', id); fetchData(); }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🏦 ナレッジ・バンク</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ ...buttonStyle, backgroundColor: '#ef4444' }}>ログアウト</button>
      </div>

      {/* 入力セクション */}
      <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #ddd', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setInputMode('書類')} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => setInputMode('ナレッジ')} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 Q&Aモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginBottom: '10px', fontSize: '12px' }} />
            
            {inputMode === '書類' && (
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const files = e.dataTransfer.files; if (files && files.length > 0) handleFileUpload(files[0]); }}
                style={{ border: '2px dashed #3b82f6', padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundColor: url ? '#f0fdf4' : '#f8fafc', marginBottom: '10px' }}
              >
                {uploading ? '送信中...' : url ? '✅ PDF準備完了' : '📁 PDFをドロップ'}
              </div>
            )}

            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              <option value="">タグを選択</option>
              {customTags.filter(t => t.type === inputMode).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={inputStyle} />
              <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b' }}>追加</button>
            </div>
          </div>
          
          <div>
            {/* ここがQ&Aの入力切り替え部分です */}
            {inputMode === 'ナレッジ' ? (
              <>
                <textarea placeholder="質問（Q）" value={question} onChange={e => setQuestion(e.target.value)} style={{ ...inputStyle, height: '80px', marginBottom: '10px', borderLeft: '5px solid #ef4444' }} />
                <textarea placeholder="回答（A）" value={answer} onChange={e => setAnswer(e.target.value)} style={{ ...inputStyle, height: '85px', borderLeft: '5px solid #2383e2' }} />
              </>
            ) : (
              <textarea placeholder="メモ・詳細" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '175px' }} />
            )}
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>保存する</button>
          </div>
        </div>
      </section>

      {/* 検索と表示 */}
      <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
      
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        {['すべて', '書類', 'ナレッジ'].map(t => (
          <button key={t} onClick={() => setDisplayTab(t as any)} style={{ border: 'none', background: 'none', color: displayTab === t ? '#2383e2' : '#64748b', fontWeight: 'bold', borderBottom: displayTab === t ? '2px solid #2383e2' : 'none', cursor: 'pointer', padding: '10px' }}>{t}</button>
        ))}
      </div>

      {docs.filter(d => {
        const tabMatch = displayTab === 'すべて' || (displayTab === '書類' && d.tags?.includes('type:doc')) || (displayTab === 'ナレッジ' && d.tags?.includes('type:knowledge'));
        const searchMatch = d.title.includes(searchQuery) || d.memo.includes(searchQuery);
        return tabMatch && searchMatch;
      }).map(doc => (
        <div key={doc.id} style={cardStyle}>
          <button onClick={() => handleDeleteDoc(doc.id)} style={{ position: 'absolute', right: '10px', top: '10px', border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}>削除</button>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2', textDecoration: 'none' }}>📄 {doc.title}</a> : `💡 ${doc.title}`}
          </h3>
          
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {doc.memo.includes('Q:') ? (
              doc.memo.split('\n').map((line: string, i: number) => (
                <div key={i} style={{ 
                  padding: '10px', marginBottom: '5px', borderRadius: '5px',
                  backgroundColor: line.startsWith('Q:') ? '#fff1f2' : '#f0f9ff',
                  borderLeft: line.startsWith('Q:') ? '4px solid #ef4444' : '4px solid #2383e2'
                }}>{line}</div>
              ))
            ) : (
              <div style={{ color: '#444' }}>{doc.memo}</div>
            )}
          </div>
          <small style={{ color: '#999', marginTop: '10px', display: 'block' }}>#{doc.tags?.find((t:string) => !t.startsWith('type:'))}</small>
        </div>
      ))}
    </main>
  );
}
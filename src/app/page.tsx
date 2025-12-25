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
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // 複数タグ管理用
  const [selectedTags, setSelectedTags] = useState<string[]>([]); 
  const [newTagName, setNewTagName] = useState('');
  const [uploading, setUploading] = useState(false);
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
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleSaveDoc = async () => {
    if (!title || selectedTags.length === 0) return alert('タイトルとタグを選択してください');
    const finalMemo = inputMode === 'ナレッジ' ? `Q: ${question}\nA: ${answer}` : memo;
    const allTags = [...selectedTags, inputMode === '書類' ? 'type:doc' : 'type:knowledge'];

    const { error } = await supabase.from('documents').insert([{
      title, url, memo: finalMemo, tags: allTags
    }]);
    if (!error) { 
      setTitle(''); setUrl(''); setMemo(''); setQuestion(''); setAnswer(''); setSelectedTags([]);
      fetchData(); alert('保存しました'); 
    }
  };

  const handleDeleteDoc = async (id: any) => {
    if (confirm('削除しますか？')) { await supabase.from('documents').delete().eq('id', id); fetchData(); }
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    setNewTagName(''); 
    fetchData();
  };

  const handleDeleteTag = async (id: any) => {
    if (confirm('このタグを削除しますか？')) { 
      await supabase.from('custom_tags').delete().eq('id', id); 
      fetchData(); 
    }
  };

  const toggleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
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

      <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #ddd', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setInputMode('書類'); setSelectedTags([]); }} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => { setInputMode('ナレッジ'); setSelectedTags([]); }} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 Q&Aモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginBottom: '10px', fontSize: '12px' }} />
            
            {inputMode === '書類' && (
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const files = e.dataTransfer.files; if (files && files.length > 0) handleFileUpload(files[0]); }}
                style={{ border: '2px dashed #3b82f6', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: url ? '#f0fdf4' : '#f8fafc', marginBottom: '10px' }}
              >
                {uploading ? '送信中...' : url ? '✅ PDF準備完了' : '📁 PDFをドロップ'}
              </div>
            )}

            {/* タグ選択UI (複数選択対応) */}
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>タグを選択（複数可）:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
              {customTags.filter(t => t.type === inputMode).map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTagSelection(t.name)}
                  style={{
                    padding: '4px 10px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer',
                    border: '1px solid #2383e2',
                    backgroundColor: selectedTags.includes(t.name) ? '#2383e2' : 'white',
                    color: selectedTags.includes(t.name) ? 'white' : '#2383e2'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* タグ追加・削除 */}
            <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ作成" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleAddTag} style={{ ...buttonStyle, padding: '5px 10px', fontSize: '11px', backgroundColor: '#64748b' }}>追加</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {customTags.filter(t => t.type === inputMode).map(t => (
                  <span key={t.id} style={{ fontSize: '10px', backgroundColor: '#fff', border: '1px solid #ddd', padding: '1px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                    {t.name}
                    <button onClick={() => handleDeleteTag(t.id)} style={{ marginLeft: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            {inputMode === 'ナレッジ' ? (
              <>
                <textarea placeholder="質問（Q）" value={question} onChange={e => setQuestion(e.target.value)} style={{ ...inputStyle, height: '80px', marginBottom: '10px', borderLeft: '5px solid #ef4444' }} />
                <textarea placeholder="回答（A）" value={answer} onChange={e => setAnswer(e.target.value)} style={{ ...inputStyle, height: '85px', borderLeft: '5px solid #2383e2' }} />
              </>
            ) : (
              <textarea placeholder="メモ・詳細" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '185px' }} />
            )}
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>保存する</button>
          </div>
        </div>
      </section>

      {/* 検索・表示 */}
      <input placeholder="🔍 タイトル、メモ、タグで検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '20px', padding: '12px' }} />
      
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        {['すべて', '書類', 'ナレッジ'].map(t => (
          <button key={t} onClick={() => setDisplayTab(t as any)} style={{ border: 'none', background: 'none', color: displayTab === t ? '#2383e2' : '#64748b', fontWeight: 'bold', borderBottom: displayTab === t ? '2px solid #2383e2' : 'none', cursor: 'pointer', padding: '10px' }}>{t}</button>
        ))}
      </div>

      {docs.filter(d => {
        const tabMatch = displayTab === 'すべて' || (displayTab === '書類' && d.tags?.includes('type:doc')) || (displayTab === 'ナレッジ' && d.tags?.includes('type:knowledge'));
        const searchMatch = d.title.includes(searchQuery) || d.memo.includes(searchQuery) || d.tags?.some((t: string) => t.includes(searchQuery));
        return tabMatch && searchMatch;
      }).map(doc => (
        <div key={doc.id} style={cardStyle}>
          <button onClick={() => handleDeleteDoc(doc.id)} style={{ position: 'absolute', right: '10px', top: '10px', border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}>削除</button>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2', textDecoration: 'none' }}>📄 {doc.title}</a> : `💡 {doc.title}`}
          </h3>
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {doc.memo.includes('Q:') ? (
              doc.memo.split('\n').map((line: string, i: number) => (
                <div key={i} style={{ padding: '8px', marginBottom: '4px', borderRadius: '5px', backgroundColor: line.startsWith('Q:') ? '#fff1f2' : '#f0f9ff', borderLeft: line.startsWith('Q:') ? '4px solid #ef4444' : '4px solid #2383e2' }}>{line}</div>
              ))
            ) : (
              <div style={{ color: '#444' }}>{doc.memo}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
            {doc.tags?.filter((t: string) => !t.startsWith('type:')).map((tag: string, i: number) => (
              <span key={i} style={{ color: '#2383e2', fontSize: '11px', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>#{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
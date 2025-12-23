'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 共通スタイル ---
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box', marginBottom: '10px' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', position: 'relative' };
const dropZoneStyle: React.CSSProperties = { border: '2px dashed #cbd5e1', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', marginBottom: '15px' };

export default function Home() {
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: d } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (d) setDocs(d);
    const { data: t } = await supabase.from('custom_tags').select('*').order('name');
    if (t) setCustomTags(t);
  };

  // --- ファイルアップロード ---
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('files').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('files').getPublicUrl(fileName);
      setUrl(data.publicUrl);
      if (!title) setTitle(file.name);
      alert('アップロード完了！');
    } catch (e: any) {
      alert('失敗: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 削除機能 ---
  const handleDelete = async (id: any) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) alert('削除失敗: ' + error.message);
    else fetchData();
  };

  // --- タグ追加 ---
  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    if (!error) { setNewTagName(''); fetchData(); alert('タグを追加しました'); }
  };

  // --- 保存 ---
  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const { error } = await supabase.from('documents').insert([{
      title,
      tags: [selectedTag, inputMode === '書類' ? 'type:doc' : 'type:knowledge'],
      url, memo
    }]);
    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(''); fetchData();
    }
  };

  return (
    <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fdfdfd' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#1e293b', fontSize: '28px', marginBottom: '10px' }}>🏦 ナレッジ・バンク</h1>
        <p style={{ color: '#64748b' }}>会社の資産（書類・知恵）を一箇所に集約</p>
      </header>

      {/* 入力セクション */}
      <section style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button onClick={() => setInputMode('書類')} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類を登録</button>
          <button onClick={() => setInputMode('ナレッジ')} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジを登録</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            
            <div 
              style={dropZoneStyle}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
              onClick={() => document.getElementById('fileIn')?.click()}
            >
              {uploading ? '送信中...' : '📎 ファイルをドロップ'}
              <input id="fileIn" type="file" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>

            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              <option value="">タグを選択</option>
              {customTags.filter(t => t.type === inputMode || !t.type).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>

            <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ名" style={{ ...inputStyle, marginBottom: 0, fontSize: '12px' }} />
              <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b', fontSize: '12px', padding: '0 15px' }}>追加</button>
            </div>
          </div>

          <div>
            <textarea 
              placeholder={inputMode === 'ナレッジ' ? "【Q】\n\n【A】" : "メモ・詳細内容"} 
              value={memo} onChange={e => setMemo(e.target.value)} 
              style={{ ...inputStyle, height: '185px', resize: 'none' }} 
            />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px', fontSize: '16px', height: '50px' }}>資産を保存する</button>
          </div>
        </div>
      </section>

      {/* 検索・一覧セクション */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', color: '#1e293b' }}>保存済み資産</h2>
          <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: '250px', marginBottom: 0 }} />
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {docs.filter(d => d.title.includes(searchQuery) || d.memo.includes(searchQuery)).map(doc => (
            <div key={doc.id} style={cardStyle}>
              <button onClick={() => handleDelete(doc.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>削除</button>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{doc.tags?.[0]}</span>
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                {doc.url ? <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title} 🔗</a> : doc.title}
              </h3>
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '14px', lineHeight: '1.6', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>{doc.memo}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
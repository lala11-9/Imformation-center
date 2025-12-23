'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', marginBottom: '15px' };
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', cursor: 'pointer', borderBottom: active ? '3px solid #2383e2' : '3px solid transparent',
  color: active ? '#2383e2' : '#64748b', fontWeight: 'bold', transition: '0.2s', backgroundColor: 'transparent', border: 'none'
});
const dropZoneStyle: React.CSSProperties = { border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', marginTop: '10px', marginBottom: '10px' };

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
  const [isTagEditMode, setIsTagEditMode] = useState(false); // タグ削除モードの切り替え
  
  const [displayTab, setDisplayTab] = useState<'すべて' | '書類' | 'ナレッジ'>('すべて');
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

  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    if (error) alert('タグ追加失敗: ' + error.message);
    else { setNewTagName(''); await fetchData(); }
  };

  // --- 💡 タグを削除する関数 ---
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('このタグを削除しますか？（登録済みの書類からは消えません）')) return;
    const { error } = await supabase.from('custom_tags').delete().eq('id', tagId);
    if (error) alert('タグ削除失敗: ' + error.message);
    else await fetchData();
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const modeTag = inputMode === '書類' ? 'type:doc' : 'type:knowledge';
    const { error } = await supabase.from('documents').insert([{
      title,
      tags: [selectedTag, modeTag],
      url, memo
    }]);
    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(inputMode === 'ナレッジ' ? "【Q】\n\n【A】" : ""); setSelectedTag('');
      fetchData();
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) alert('削除失敗: ' + error.message);
    else fetchData();
  };

  const filteredDocs = docs.filter(doc => {
    const isDoc = doc.tags?.includes('type:doc');
    const isKnowledge = doc.tags?.includes('type:knowledge');
    let matchesTab = true;
    if (displayTab === '書類') matchesTab = isDoc;
    if (displayTab === 'ナレッジ') matchesTab = isKnowledge;
    const matchesSearch = doc.title.includes(searchQuery) || doc.memo.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setInputMode('書類'); setMemo(''); }} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => { setInputMode('ナレッジ'); setMemo("【Q】\n\n【A】"); }} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <div style={dropZoneStyle} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }} onClick={() => document.getElementById('fileIn')?.click()}>
              {uploading ? 'アップロード中...' : '📎 PDF等をドロップ または クリック'}
              <input id="fileIn" type="file" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
            
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                <option value="">タグを選択</option>
                {customTags.filter(t => t.type === inputMode || !t.type).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <button onClick={() => setIsTagEditMode(!isTagEditMode)} style={{ ...buttonStyle, backgroundColor: isTagEditMode ? '#ef4444' : '#64748b', fontSize: '11px', padding: '0 10px' }}>
                {isTagEditMode ? '戻る' : '整理'}
              </button>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              {isTagEditMode ? (
                <div>
                  <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>×ボタンでタグを削除</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {customTags.filter(t => t.type === inputMode || !t.type).map(t => (
                      <span key={t.id} style={{ fontSize: '12px', background: '#fff', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {t.name} <button onClick={() => handleDeleteTag(t.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新しいタグ名" style={{ ...inputStyle, backgroundColor: 'white' }} />
                  <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b', fontSize: '12px' }}>追加</button>
                </div>
              )}
            </div>
          </div>
          <div>
            <textarea placeholder="内容を入力" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '210px', resize: 'none' }} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>保存する</button>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex' }}>
            {['すべて', '書類', 'ナレッジ'].map((t: any) => (
              <button key={t} onClick={() => setDisplayTab(t)} style={tabStyle(displayTab === t)}>{t}</button>
            ))}
          </div>
          <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
        </div>
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredDocs.map(doc => (
            <div key={doc.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {doc.tags?.filter((t:string) => !t.startsWith('type:'))[0]}
                </span>
                <button onClick={() => handleDelete(doc.id)} style={{ border: 'none', background: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>削除</button>
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 10px 0' }}>
                {doc.url ? <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title} 🔗</a> : doc.title}
              </h3>
              <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>{doc.memo}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
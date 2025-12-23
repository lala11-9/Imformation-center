'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル定義 ---
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const stepButtonStyle: React.CSSProperties = { backgroundColor: 'white', color: '#334155', border: '2px solid #e2e8f0', padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', fontSize: '15px' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: '#475569', fontWeight: 'bold' };
const lockBadgeStyle: React.CSSProperties = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', marginLeft: '5px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string, type: string}[]>([]);
  
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<'書類' | 'ナレッジ' | 'ミニ'>('書類');
  const [visibility, setVisibility] = useState('非公開');

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
    const { data: tagsData } = await supabase.from('custom_tags').select('*');
    if (tagsData) setCustomTags(tagsData);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログイン失敗: ' + error.message);
    else window.location.reload();
  };

  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');

    const finalTags = docType === '書類' ? [selectedTag, visibility] : [selectedTag];
    const displayTitle = docType === '書類' ? title : `【${docType}】${title}`;

    // エラー回避のため user_id 列がない場合はここから user_id を消してください
    const { error } = await supabase.from('documents').insert([{
      title: displayTitle,
      tags: finalTags,
      url: docType === '書類' ? url : '',
      memo: memo,
      // user_id: user.id  // ← テーブルに user_id 列がない場合はここをコメントアウト
    }]);

    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(''); setStep(1);
      await fetchData();
    } else {
      alert('エラー: ' + error.message);
    }
  };

  // --- タグの使い分けロジック ---
  // 書類の時は「公開範囲など」、ナレッジの時は「技術分野など」を出すイメージ
  const filteredTagsForInput = customTags.filter(t => {
    if (docType === '書類') return t.type === '書類' || !t.type;
    return t.type === 'ナレッジ' || !t.type;
  });

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '350px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '22px', textAlign: 'center' }}>📁 ログイン</h1>
          <input type="email" placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button type="submit" style={{ ...buttonStyle, width: '100%' }}>ログイン</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>📁 ナレッジ・アーカイブ</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px' }}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '30px' }}>
        <aside>
          <div style={sideSectionStyle}>
            <h2 style={{ fontSize: '15px', marginBottom: '15px', color: '#475569' }}>
              Step {step}: {step === 1 ? "種類を選択" : step === 2 ? "公開範囲" : "詳細入力"}
            </h2>

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setDocType('書類'); setStep(2); }} style={stepButtonStyle}>📄 書類を登録</button>
                <button onClick={() => { setDocType('ナレッジ'); setMemo("【Q】\n\n【A】"); setStep(3); }} style={stepButtonStyle}>💡 ナレッジを登録</button>
                <button onClick={() => { setDocType('ミニ'); setMemo("【Q】\n\n【A】"); setStep(3); }} style={stepButtonStyle}>⚡ ミニナレッジを登録</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setVisibility('一般公開'); setStep(3); }} style={stepButtonStyle}>🌍 一般公開</button>
                <button onClick={() => { setVisibility('限定公開'); setStep(3); }} style={stepButtonStyle}>👥 限定公開</button>
                <button onClick={() => { setVisibility('非公開'); setStep(3); }} style={stepButtonStyle}>🔒 非公開</button>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px' }}>← 戻る</button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '10px', color: '#2383e2' }}>
                  モード: <strong>{docType}</strong> {docType === '書類' && `[${visibility}]`}
                </div>
                <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                  <option value="">タグを選択してください</option>
                  {filteredTagsForInput.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                {docType === '書類' && <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />}
                <textarea placeholder="内容" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '150px' }} />
                <button onClick={handleSave} style={{ ...buttonStyle, width: '100%' }}>資産を保存</button>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', width: '100%', marginTop: '10px' }}>キャンセル</button>
              </div>
            )}
          </div>

          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '13px', marginBottom: '10px' }}>🏷️ 新しいタグを追加</h3>
            <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="タグ名" style={inputStyle} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={async () => {
                await supabase.from('custom_tags').insert([{ name: newTagName, type: '書類' }]);
                setNewTagName(''); fetchData();
              }} style={{ ...buttonStyle, flex: 1, backgroundColor: '#64748b' }}>書類用</button>
              <button onClick={async () => {
                await supabase.from('custom_tags').insert([{ name: newTagName, type: 'ナレッジ' }]);
                setNewTagName(''); fetchData();
              }} style={{ ...buttonStyle, flex: 1, backgroundColor: '#64748b' }}>ナレッジ用</button>
            </div>
          </div>
        </aside>

        <section>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '5px' }}>
              <option value="すべて">すべての分野</option>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {docs.filter(d => filterTag === 'すべて' || d.tags?.includes(filterTag)).map(doc => (
              <div key={doc.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  {doc.tags?.map((t: string) => (
                    <span key={t} style={tagBadgeStyle}>
                      {t}
                      {t === '非公開' && <span style={lockBadgeStyle}>🔒</span>}
                    </span>
                  ))}
                </div>
                <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
                  {doc.url ? <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a> : doc.title}
                </h2>
                <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  {doc.memo}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
'use client'; // これを入れると、ボタンなどの動きが作れるようになります

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('12月25日に向けて準備中！');

  const handleClick = () => {
    setMessage('応援ありがとうございます！頑張ります！');
  };

  return (
    <main style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0070f3' }}>おもいやりツール（仮）</h1>
      
      <div style={{ margin: '20px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
        {message}
      </div>

      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ここをクリックしてみて！
      </button>

      <p style={{ marginTop: '50px', color: '#666' }}>
        ※ボタンを押すと上の文字が変わります
      </p>
    </main>
  );
}
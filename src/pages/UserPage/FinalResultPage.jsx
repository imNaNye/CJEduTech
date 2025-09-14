import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import resultExample from '@/assets/images/final_result_example.png'; // 번들 포함 이미지

function FinalResultPage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/user/end', { replace: true });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'black',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={handleClick}
    >
      <img
        src={resultExample}
        alt="최종 결과 예시"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}

export default memo(FinalResultPage);
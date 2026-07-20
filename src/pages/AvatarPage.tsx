import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { PageHeader } from '../components/Layout';
import { DEFAULT_AVATAR } from '../lib/avatar';

export function AvatarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const kid = useStore((s) => s.kids.find((k) => k.id === id));
  const setAvatar = useStore((s) => s.setAvatar);
  const [config, setConfig] = useState(kid?.avatar ?? DEFAULT_AVATAR);

  if (!kid) {
    return <p className="text-center text-slate-500">Kid not found.</p>;
  }

  return (
    <div>
      <PageHeader title={`${kid.name}'s Avatar`} subtitle="Mix and match to make it yours!" />
      <div className="card p-5">
        <AvatarBuilder value={config} onChange={setConfig} />
      </div>
      <div className="sticky bottom-20 mt-5 flex gap-3 md:bottom-4">
        <button className="btn-ghost flex-1" onClick={() => navigate('/kids')}>
          Cancel
        </button>
        <button
          className="btn-primary flex-1"
          onClick={() => {
            setAvatar(kid.id, config);
            navigate('/kids');
          }}
        >
          Save avatar
        </button>
      </div>
    </div>
  );
}

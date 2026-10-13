import { ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <span className="announcement-dot" />
      Thoughtful farm care, delivered to your door.
      <a href="#promise">Get to know Fieldwell <ArrowRight size={12} /></a>
    </div>
  );
}


import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Grip } from 'lucide-react';

interface DashboardPanelProps {
  id: string;
  index: number;
  size: 'small' | 'medium' | 'large' | 'full';
  children: React.ReactNode;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ id, index, size, children }) => {
  const getPanelClasses = (size: string) => {
    switch(size) {
      case 'small': return 'col-span-12 md:col-span-4';
      case 'medium': return 'col-span-12 md:col-span-8';
      case 'large': return 'col-span-12';
      case 'full': return 'col-span-12';
      default: return 'col-span-12 md:col-span-6';
    }
  };

  return (
    <Draggable key={id} draggableId={id} index={index}>
      {(provided) => (
        <div
          className={`${getPanelClasses(size)} group`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="h-full relative">
            <div 
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 rounded-md p-1 cursor-move"
              {...provided.dragHandleProps}
            >
              <Grip className="h-4 w-4 text-muted-foreground" />
            </div>
            {children}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default DashboardPanel;

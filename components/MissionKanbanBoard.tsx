"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { apiUrl } from "@/lib/client-api-base";
import type { Commitment } from "@/lib/mission-control-types";

type Status = Commitment["status"];

type Props = {
  commitments: Commitment[];
  focusMode: boolean;
  onUpdated: () => Promise<void>;
  onError: (message: string) => void;
};

const COLUMNS: Array<{ key: Status; label: string }> = [
  { key: "committed", label: "Committed" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

function statusAllowsTransition(from: Status, to: Status) {
  const map: Record<Status, Status[]> = {
    committed: ["in_progress"],
    in_progress: ["blocked", "done"],
    blocked: ["in_progress"],
    done: [],
  };
  return map[from].includes(to);
}

function CommitmentCard({ commitment, active, onSelect }: { commitment: Commitment; active?: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: commitment.id, data: { commitment } });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`mission-card ${active ? "active" : ""}`}
      style={style}
      onClick={() => onSelect(commitment.id)}
      {...listeners}
      {...attributes}
    >
      <strong>{commitment.title}</strong>
      <div className="mission-card-indicators">
        <span className="small muted">decision</span>
        <span className={`indicator ${commitment.decision_id ? "on" : "off"}`} />
        <span className="small muted">proof</span>
        <span className={`indicator ${commitment.proof_id ? "on" : "off"}`} />
      </div>
      <p className="small muted">{commitment.last_updated_at || commitment.created_at}</p>
    </button>
  );
}

function KanbanColumn({
  status,
  label,
  items,
  selectedId,
  onSelect,
}: {
  status: Status;
  label: string;
  items: Commitment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <article ref={setNodeRef} className={`panel mission-column ${isOver ? "is-over" : ""}`}>
      <div className="decision-header">
        <h3>{label}</h3>
        <span className="badge">{items.length}</span>
      </div>
      <div className="stack compact">
        {items.map((item) => (
          <CommitmentCard key={item.id} commitment={item} active={item.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </article>
  );
}

function MissionKanbanBoard({ commitments, focusMode, onUpdated, onError }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Commitment | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const visibleCommitments = useMemo(
    () => (focusMode ? commitments.filter((c) => c.status !== "done") : commitments),
    [commitments, focusMode],
  );

  const byStatus = useMemo(() => {
    const map: Record<Status, Commitment[]> = {
      committed: [],
      in_progress: [],
      blocked: [],
      done: [],
    };

    for (const item of visibleCommitments) {
      map[item.status].push(item);
    }

    return map;
  }, [visibleCommitments]);

  const selected = useMemo(() => commitments.find((item) => item.id === selectedId) ?? null, [commitments, selectedId]);

  const onDragStart = useCallback((event: { active: { data: { current?: { commitment?: Commitment } } } }) => {
    const commitment = event.active.data.current?.commitment;
    setDragging(commitment ?? null);
  }, []);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDragging(null);
      const activeCommitment = event.active.data.current?.commitment as Commitment | undefined;
      const targetStatus = event.over?.id as Status | undefined;
      if (!activeCommitment || !targetStatus || activeCommitment.status === targetStatus) return;
      if (!statusAllowsTransition(activeCommitment.status, targetStatus)) {
        onError(`Invalid transition: ${activeCommitment.status} -> ${targetStatus}`);
        return;
      }

      const res = await fetch(apiUrl("/api/mission-control/update-status"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: activeCommitment.id, status: targetStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onError(typeof body.error === "string" ? body.error : "Status transition failed.");
        return;
      }

      await onUpdated();
    },
    [onError, onUpdated],
  );

  return (
    <div className="kanban-wrap">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="kanban">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.key}
              status={column.key}
              label={column.label}
              items={byStatus[column.key]}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <DragOverlay>{dragging ? <div className="mission-card drag-overlay"><strong>{dragging.title}</strong></div> : null}</DragOverlay>
      </DndContext>

      <aside className="panel detail-panel">
        <h3>Commitment Detail</h3>
        {!selected ? (
          <p className="small muted">Select a card to inspect details.</p>
        ) : (
          <div className="stack compact">
            <p><strong>{selected.title}</strong></p>
            <p className="small muted">status: {selected.status}</p>
            <p className="small muted">task_id: {selected.task_id}</p>
            <p className="small muted">decision_id: {selected.decision_id}</p>
            <p className="small muted">proof_required: {String(selected.proof_required)}</p>
            <p className="small muted">proof_id: {selected.proof_id || "-"}</p>
            <p className="small muted">updated_at: {selected.last_updated_at || selected.created_at}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default memo(MissionKanbanBoard);

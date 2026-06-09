import React from "react";

const ContextMenu = ({
    x,
    y,
    targetId,
    elements,
    moveZIndex,
    updateSelectedElementState,
    handleDuplicateElement,
    handleDeleteElementById,
    addTextElement,
    handleAddShape
}) => {
    const targetEl = elements.find((item) => item.id === targetId);

    const MenuBtn = ({ onClick, icon, label, shortcut, danger }) => (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors text-xs ${
                danger
                    ? "hover:bg-red-500/15 text-red-400 hover:text-red-300"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
            }`}
        >
            <i className={`${icon} text-sm w-4 flex-shrink-0 ${danger ? "" : "text-white/45"}`} />
            <span className="flex-1 font-medium">{label}</span>
            {shortcut && <span className="text-[9px] text-white/25 font-mono">{shortcut}</span>}
        </button>
    );

    const Divider = () => <div className="h-[1px] bg-white/5 my-1 mx-1" />;

    return (
        <div 
            style={{ top: `${y}px`, left: `${x}px` }} 
            className="fixed bg-[#1f1f23]/97 border border-[#2e2e34] rounded-2xl shadow-2xl p-1.5 z-[99999] min-w-[180px] backdrop-blur-xl text-xs space-y-0.5 animate-in zoom-in-95 duration-100 text-white"
        >
            {targetId ? (
                <>
                    {/* Z-Index Ordering */}
                    <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/25">Layer Order</div>
                    <MenuBtn
                        onClick={() => moveZIndex("front")}
                        icon="ri-bring-to-front"
                        label="Bring to Front"
                        shortcut="Ctrl+Shift+]"
                    />
                    <MenuBtn
                        onClick={() => moveZIndex("forward")}
                        icon="ri-bring-forward"
                        label="Move Forward"
                        shortcut="Ctrl+]"
                    />
                    <MenuBtn
                        onClick={() => moveZIndex("backward")}
                        icon="ri-send-backward"
                        label="Move Backward"
                        shortcut="Ctrl+["
                    />
                    <MenuBtn
                        onClick={() => moveZIndex("back")}
                        icon="ri-send-to-back"
                        label="Send to Back"
                        shortcut="Ctrl+Shift+["
                    />

                    <Divider />

                    {/* Element Actions */}
                    <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/25">Element</div>
                    <MenuBtn
                        onClick={() => updateSelectedElementState(targetId, "isLocked", !targetEl?.isLocked)}
                        icon={targetEl?.isLocked ? "ri-lock-unlock-line" : "ri-lock-line"}
                        label={targetEl?.isLocked ? "Unlock Layer" : "Lock Layer"}
                    />
                    <MenuBtn
                        onClick={() => updateSelectedElementState(targetId, "hidden", !targetEl?.hidden)}
                        icon={targetEl?.hidden ? "ri-eye-line" : "ri-eye-off-line"}
                        label={targetEl?.hidden ? "Show Layer" : "Hide Layer"}
                    />
                    <MenuBtn
                        onClick={() => handleDuplicateElement(targetId)}
                        icon="ri-file-copy-line"
                        label="Duplicate"
                        shortcut="Ctrl+D"
                    />

                    <Divider />

                    <MenuBtn
                        onClick={() => handleDeleteElementById(targetId)}
                        icon="ri-delete-bin-3-line"
                        label="Delete"
                        shortcut="Del"
                        danger
                    />
                </>
            ) : (
                <>
                    {/* Canvas-level actions */}
                    <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/25">Add Element</div>
                    <MenuBtn
                        onClick={addTextElement}
                        icon="ri-text"
                        label="Add Text Block"
                    />
                    <MenuBtn
                        onClick={() => handleAddShape("rect")}
                        icon="ri-checkbox-blank-line"
                        label="Add Rectangle"
                    />
                    <MenuBtn
                        onClick={() => handleAddShape("circle")}
                        icon="ri-circle-line"
                        label="Add Circle"
                    />
                    <MenuBtn
                        onClick={() => handleAddShape("star_5")}
                        icon="ri-star-line"
                        label="Add Star"
                    />
                </>
            )}
        </div>
    );
};

export default ContextMenu;

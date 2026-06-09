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

    return (
        <div 
            style={{ top: `${y}px`, left: `${x}px` }} 
            className="fixed bg-[#1f1f23]/95 border border-[#2a2a30]/80 rounded-2xl shadow-2xl p-2.5 z-[99999] min-w-[160px] backdrop-blur-md text-xs space-y-1 animate-in zoom-in-95 duration-100 text-white"
        >
            {targetId ? (
                <>
                    <button 
                        onClick={() => moveZIndex("front")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Bring to Front</span>
                        <span className="text-[10px] text-white/35">]</span>
                    </button>
                    <button 
                        onClick={() => moveZIndex("back")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Send to Back</span>
                        <span className="text-[10px] text-white/35">[</span>
                    </button>
                    <button 
                        onClick={() => moveZIndex("forward")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Move Forward</span>
                        <span className="text-[10px] text-white/35">Ctrl+]</span>
                    </button>
                    <button 
                        onClick={() => moveZIndex("backward")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Move Backward</span>
                        <span className="text-[10px] text-white/35">Ctrl+[</span>
                    </button>
                    <div className="h-[1px] bg-white/5 my-1" />
                    <button 
                        onClick={() => updateSelectedElementState(targetId, "isLocked", !targetEl?.isLocked)} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>{targetEl?.isLocked ? "Unlock Layer" : "Lock Layer"}</span>
                        <i className="ri-lock-line text-[10px]" />
                    </button>
                    <button 
                        onClick={() => handleDuplicateElement(targetId)} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Duplicate</span>
                        <span className="text-[10px] text-white/35">Ctrl+D</span>
                    </button>
                    <div className="h-[1px] bg-white/5 my-1" />
                    <button 
                        onClick={() => handleDeleteElementById(targetId)} 
                        className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Delete</span>
                        <i className="ri-delete-bin-line text-[10px]" />
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={addTextElement} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Add Text</span>
                        <i className="ri-text text-[10px]" />
                    </button>
                    <button 
                        onClick={() => handleAddShape("rect")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Add Rectangle</span>
                        <i className="ri-checkbox-blank-line text-[10px]" />
                    </button>
                    <button 
                        onClick={() => handleAddShape("circle")} 
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                        <span>Add Circle</span>
                        <i className="ri-checkbox-blank-circle-line text-[10px]" />
                    </button>
                </>
            )}
        </div>
    );
};

export default ContextMenu;

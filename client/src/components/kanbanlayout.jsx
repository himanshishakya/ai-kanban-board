import React from 'react';

function KanbanLayout() {
    return (
        <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
            
            {/* 1. LEFT SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800">
                <div>
                    {/* Workspace Header */}
                    <div className="p-4 flex items-center gap-3 border-b border-slate-800">
                        <div className="bg-purple-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">M</div>
                        <div>
                            <h1 className="text-sm font-semibold text-white">Marketing</h1>
                            <span className="text-xs text-slate-400">Enterprise Space</span>
                        </div>
                    </div>

                    {/* Navigation Folders */}
                    <div className="p-3 space-y-1 text-sm">
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Folders</p>
                        <a href="#" className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300">📁 Awareness Campaign</a>
                        <a href="#" className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300">📁 Content Strategy</a>
                        <a href="#" className="block px-3 py-2 rounded-md bg-purple-600/20 text-purple-400 font-medium">📁 Product Launch Plan</a>
                        <a href="#" className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300">📁 SEO Optimization</a>
                    </div>
                </div>

                {/* Sidebar Footer / Profile */}
                <div className="p-4 border-t border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">HS</div>
                    <span className="text-sm font-medium text-white">Himanshi Shakya</span>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col overflow-hidden">
                
                {/* Top Navbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Apex Tech</h2>
                        <div className="flex gap-2">
                            <button className="bg-purple-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-purple-700">+ New Task</button>
                        </div>
                    </div>
                    {/* View Switcher Tabs */}
                    <div className="flex gap-6 text-sm border-b border-gray-100 pb-1">
                        <button className="text-gray-500 hover:text-gray-800 pb-1">Gantt</button>
                        <button className="text-purple-600 font-semibold border-b-2 border-purple-600 pb-1">Board</button>
                        <button className="text-gray-500 hover:text-gray-800 pb-1">Calendar</button>
                        <button className="text-gray-500 hover:text-gray-800 pb-1">Info</button>
                    </div>
                </header>

                {/* 3. KANBAN COLUMNS GRID */}
                <div className="flex-1 p-6 overflow-x-auto bg-gray-50 flex gap-6">
                    
                    {/* Column 1: Not Started */}
                    <div className="w-80 flex-shrink-0 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <h3 className="font-semibold text-sm text-slate-700">Not Started</h3>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">2</span>
                            </div>
                        </div>
                        
                        {/* Task Cards Container */}
                        <div className="space-y-3 flex-1">
                            {/* Card 1 */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition cursor-pointer">
                                <p className="text-sm font-medium text-slate-800 mb-2">Test recurring payments</p>
                                <p className="text-xs text-gray-500 mb-3">Ensure the recurring payment feature works correctly.</p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">Payment Gateway</span>
                                    <span>#82</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="w-80 flex-shrink-0 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <h3 className="font-semibold text-sm text-slate-700">In Progress</h3>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">1</span>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition cursor-pointer">
                                <p className="text-sm font-medium text-slate-800 mb-2">Build account dashboard</p>
                                <p className="text-xs text-gray-500 mb-3">Develop a user-friendly interface for account details.</p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Banking App</span>
                                    <span>#12</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Review */}
                    <div className="w-80 flex-shrink-0 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <h3 className="font-semibold text-sm text-slate-700">Review</h3>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">1</span>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition cursor-pointer">
                                <p className="text-sm font-medium text-slate-800 mb-2">Add rule-based checks</p>
                                <p className="text-xs text-gray-500 mb-3">Implement basic rules to detect potential fraud.</p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-medium">Fraud Detection</span>
                                    <span>#75</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 4: On Hold */}
                    <div className="w-80 flex-shrink-0 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                                <h3 className="font-semibold text-sm text-slate-700">On Hold</h3>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">1</span>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition cursor-pointer">
                                <p className="text-sm font-medium text-slate-800 mb-2">KYC upload feature</p>
                                <p className="text-xs text-gray-500 mb-3">Enable users to upload identity documents for verification.</p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-medium">Onboarding</span>
                                    <span>#85</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default KanbanLayout;
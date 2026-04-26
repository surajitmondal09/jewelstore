"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconMail, IconPhone, IconCheck, IconSearch, IconCalendar } from "@tabler/icons-react";

type SupportMessage = {
    $id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
};

export default function SupportDashboard() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<any>("/api/support");
            if (response.data?.error) {
                toast.error(response.data.error);
            } else {
                setMessages(response.data);
            }
        } catch (error) {
            toast.error("Failed to load support messages");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "Open" ? "Closed" : "Open";
        try {
            const response = await axios.put<any>("/api/support", { messageId: id, status: newStatus });
            if (response.data?.error) {
                toast.error(response.data.error);
            } else {
                toast.success(`Message marked as ${newStatus}`);
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.$id === id ? { ...msg, status: newStatus } : msg
                    )
                );
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredMessages = messages.filter((msg) => {
        const matchesSearch =
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All" || msg.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col justify-start items-center relative pb-10 min-h-screen pt-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h1 className="font-bold text-2xl tracking-tight">Support Requests</h1>
                    <Button onClick={fetchMessages} variant="outline" disabled={isLoading}>
                        {isLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>

                <Card className="animate-in fade-in duration-300">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <div className="flex-1">
                                <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                                    Search
                                </label>
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or subject..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                                    Status Filter
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>

                    <div className="divide-y divide-border">
                        {isLoading && messages.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                Loading messages...
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                No support messages found.
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.$id}
                                    className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col gap-4"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{msg.subject}</h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {msg.name}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <IconMail size={14} />
                                                    <a href={`mailto:${msg.email}`} className="hover:text-primary transition-colors">{msg.email}</a>
                                                </div>
                                                {msg.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <IconPhone size={14} />
                                                        <a href={`tel:${msg.phone}`} className="hover:text-primary transition-colors">{msg.phone}</a>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <IconCalendar size={14} />
                                                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                                                    msg.status === "Open"
                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                                        : "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary/80"
                                                }`}
                                            >
                                                {msg.status}
                                            </span>
                                            <Button
                                                variant={msg.status === "Open" ? "default" : "outline"}
                                                size="sm"
                                                className={msg.status === "Open" ? "bg-primary hover:bg-primary/90" : ""}
                                                onClick={() => toggleStatus(msg.$id, msg.status)}
                                            >
                                                {msg.status === "Open" ? (
                                                    <><IconCheck size={16} className="mr-1" /> Mark Closed</>
                                                ) : (
                                                    "Reopen"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-md text-sm border">
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

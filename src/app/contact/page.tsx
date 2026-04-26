"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { IconMail, IconPhone, IconMapPin, IconSend } from "@tabler/icons-react";
import { motion } from "framer-motion";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post<any>("/api/support", formData);
            if (response.data?.error) {
                toast.error(response.data.error);
            } else {
                toast.success("Your message has been sent successfully! We will get back to you soon.");
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                });
            }
        } catch (error) {
            toast.error("Failed to send message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <Navbar />
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                {/* Left side: Information */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col justify-center"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-neutral-400 mb-10 leading-relaxed">
                        Have a question about our products, need help with an order, or just want to say hi? 
                        We're here for you. Fill out the form, and our support team will reach out within 24 hours.
                    </p>

                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-primary/80 shadow-sm shadow-blue-500/10">
                                <IconMail size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Email Us</h3>
                                <p className="text-neutral-500">support@techstore.com</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-purple-400 shadow-sm shadow-purple-500/10">
                                <IconPhone size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Call Us</h3>
                                <p className="text-neutral-500">+1 (800) 123-4567</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-pink-400 shadow-sm shadow-pink-500/10">
                                <IconMapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Visit Us</h3>
                                <p className="text-neutral-500">123 Tech Avenue, Silicon Valley, CA</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right side: Form */}
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
                        <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Your Name *</Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                        className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Email Address *</Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com"
                                        className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Phone Number (Optional)</Label>
                                    <Input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Subject *</Label>
                                    <Input
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help?"
                                        className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-neutral-300">Message *</Label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Write your message here..."
                                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 resize-none"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg font-medium tracking-wide shadow-lg shadow-purple-500/20 transition-all duration-300 active:scale-[0.98]"
                            >
                                {isSubmitting ? "Sending..." : (
                                    <>
                                        Send Message <IconSend size={20} className="ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
        <Footer />
        </>
    );
}

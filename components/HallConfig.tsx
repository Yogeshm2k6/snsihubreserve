import React, { useState, useRef } from 'react';
import { Hall } from '../types';
import { HALLS } from '../constants';
import { db, storage } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Pencil, Trash2, X, Database, Save, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HallConfigProps {
    halls: Hall[];
}

const emptyHall: Omit<Hall, 'id'> = {
    name: '',
    floor: '2nd Floor',
    capacity: 0,
    description: '',
    amenities: [],
    imageUrl: '',
};

export const HallConfig: React.FC<HallConfigProps> = ({ halls }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingHall, setEditingHall] = useState<Hall | null>(null);
    const [form, setForm] = useState<Omit<Hall, 'id'> & { id?: string }>(emptyHall);
    const [amenitiesText, setAmenitiesText] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openAddModal = () => {
        setEditingHall(null);
        setForm(emptyHall);
        setAmenitiesText('');
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const openEditModal = (hall: Hall) => {
        setEditingHall(hall);
        setForm({ ...hall });
        setAmenitiesText(hall.amenities.join(', '));
        setImageFile(null);
        setImagePreview(hall.imageUrl || '');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.floor.trim() || form.capacity <= 0) {
            toast.error('Please fill in name, floor, and a valid capacity.');
            return;
        }

        const hallData: Omit<Hall, 'id'> = {
            name: form.name.trim(),
            floor: form.floor.trim(),
            capacity: Number(form.capacity),
            description: form.description.trim(),
            amenities: amenitiesText.split(',').map(a => a.trim()).filter(a => a),
            imageUrl: form.imageUrl?.trim() || '',
        };

        // Upload image if a new file was selected
        if (imageFile) {
            try {
                setUploading(true);
                const hallId = editingHall ? editingHall.id : Date.now().toString();
                const storageRef = ref(storage, `hall-images/${hallId}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                const downloadUrl = await getDownloadURL(storageRef);
                hallData.imageUrl = downloadUrl;
                setUploading(false);
            } catch (uploadErr) {
                console.error('Image upload error:', uploadErr);
                toast.error('Failed to upload image. Saving hall without image.');
                setUploading(false);
            }
        }

        try {
            if (editingHall) {
                // Update existing
                await setDoc(doc(db, 'halls', editingHall.id), { ...hallData });
                toast.success(`"${hallData.name}" updated successfully!`);
            } else {
                // Add new — auto-generate ID
                const newId = Date.now().toString();
                await setDoc(doc(db, 'halls', newId), { ...hallData });
                toast.success(`"${hallData.name}" added successfully!`);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error saving hall:', error);
            toast.error('Failed to save hall. Check Firestore permissions.');
        }
    };

    const handleDelete = async (hallId: string, hallName: string) => {
        try {
            await deleteDoc(doc(db, 'halls', hallId));
            toast.success(`"${hallName}" deleted.`);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting hall:', error);
            toast.error('Failed to delete hall.');
        }
    };

    const seedDefaults = async () => {
        try {
            const batch = writeBatch(db);
            HALLS.forEach(hall => {
                const ref = doc(db, 'halls', hall.id);
                const { id, ...data } = hall;
                batch.set(ref, data);
            });
            await batch.commit();
            toast.success(`Loaded ${HALLS.length} default halls into database!`);
        } catch (error) {
            console.error('Error seeding halls:', error);
            toast.error('Failed to seed default halls.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card-glass rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-accent-800">⚙️ Hall Configuration</h2>
                        <p className="text-gray-500 text-sm mt-1">Add, edit or remove halls and spaces</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={seedDefaults}
                            className="flex items-center gap-2 px-4 py-2.5 bg-accent-100 hover:bg-accent-200 text-accent-700 rounded-xl text-sm font-semibold transition-all border border-accent-300"
                        >
                            <Database className="w-4 h-4" />
                            Load Defaults
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Hall
                        </button>
                    </div>
                </div>
            </div>

            {/* Hall List */}
            <div className="card-glass rounded-2xl shadow-lg overflow-hidden">
                {halls.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No halls configured yet</p>
                        <p className="text-sm mt-1">Click "Load Defaults" to add the standard halls, or "Add Hall" to create a new one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-accent-50 border-b border-accent-200">
                                    <th className="text-left px-5 py-3 font-bold text-accent-700 uppercase tracking-wider text-xs">Hall Name</th>
                                    <th className="text-left px-5 py-3 font-bold text-accent-700 uppercase tracking-wider text-xs">Floor</th>
                                    <th className="text-left px-5 py-3 font-bold text-accent-700 uppercase tracking-wider text-xs">Capacity</th>
                                    <th className="text-left px-5 py-3 font-bold text-accent-700 uppercase tracking-wider text-xs hidden md:table-cell">Amenities</th>
                                    <th className="text-right px-5 py-3 font-bold text-accent-700 uppercase tracking-wider text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {halls.map((hall, idx) => (
                                    <tr key={hall.id} className={`border-b border-gray-100 hover:bg-accent-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="px-5 py-4 font-semibold text-accent-800">{hall.name}</td>
                                        <td className="px-5 py-4 text-gray-600">{hall.floor}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">{hall.capacity} seats</span>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {hall.amenities.map((a, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{a}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(hall)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {deleteConfirm === hall.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(hall.id, hall.name)}
                                                            className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded font-bold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(hall.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-accent-800">
                                {editingHall ? `Edit "${editingHall.name}"` : 'Add New Hall'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Hall Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-500 outline-none text-sm"
                                    placeholder="e.g. Conference Room A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Floor *</label>
                                    <select
                                        value={form.floor}
                                        onChange={e => setForm({ ...form, floor: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-500 outline-none text-sm"
                                    >
                                        <option value="1st Floor">1st Floor</option>
                                        <option value="2nd Floor">2nd Floor</option>
                                        <option value="3rd Floor">3rd Floor</option>
                                        <option value="4th Floor">4th Floor</option>
                                        <option value="5th Floor">5th Floor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity *</label>
                                    <input
                                        type="number"
                                        value={form.capacity || ''}
                                        onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-500 outline-none text-sm"
                                        placeholder="e.g. 50"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-500 outline-none text-sm resize-none"
                                    rows={2}
                                    placeholder="Short description of the space..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Amenities</label>
                                <input
                                    type="text"
                                    value={amenitiesText}
                                    onChange={e => setAmenitiesText(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-500 outline-none text-sm"
                                    placeholder="Comma-separated, e.g. Projector, AC, Whiteboard"
                                />
                                <p className="text-xs text-gray-400 mt-1">Separate each amenity with a comma</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Hall Image</label>
                                <div className="space-y-3">
                                    {(imagePreview || form.imageUrl) && (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                                            <img
                                                src={imagePreview || form.imageUrl}
                                                alt="Hall preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer transition-all"
                                    >
                                        <Upload className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-medium">
                                            {imageFile ? imageFile.name : 'Click to upload image'}
                                        </span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImageFile(file);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={uploading}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {uploading ? 'Uploading...' : editingHall ? 'Update Hall' : 'Add Hall'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

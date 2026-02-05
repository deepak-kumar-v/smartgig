
import { VideoRoom } from "@prisma/client";

export const videoApi = {
    createRoom: async (contractId?: string): Promise<VideoRoom> => {
        const res = await fetch('/api/video-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId }),
        });
        if (!res.ok) throw new Error('Failed to create video room');
        return res.json();
    },

    getRoom: async (roomId: string): Promise<VideoRoom> => {
        const res = await fetch(`/api/video-rooms?roomId=${roomId}`);
        if (!res.ok) throw new Error('Failed to get video room');
        return res.json();
    }
};

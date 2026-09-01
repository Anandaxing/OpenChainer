/**
 * Helper to downscale an image file into a max 240px WebP thumbnail (~15KB)
 * for compact localStorage history caching without network calls.
 */
export function generateThumbnail(imageSource: File | string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => {
			const MAX_SIZE = 240;
			let width = img.width;
			let height = img.height;

			if (width > height) {
				if (width > MAX_SIZE) {
					height = Math.round((height * MAX_SIZE) / width);
					width = MAX_SIZE;
				}
			} else {
				if (height > MAX_SIZE) {
					width = Math.round((width * MAX_SIZE) / height);
					height = MAX_SIZE;
				}
			}

			const canvas = document.createElement("canvas");
			canvas.width = Math.max(width, 1);
			canvas.height = Math.max(height, 1);

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Canvas 2D context not supported"));
				return;
			}

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			try {
				const dataUrl = canvas.toDataURL("image/webp", 0.8);
				resolve(dataUrl);
			} catch {
				resolve(canvas.toDataURL("image/png"));
			}
		};

		img.onerror = () =>
			reject(new Error("Failed to load image for thumbnail creation"));

		if (typeof imageSource === "string") {
			img.src = imageSource;
		} else {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					img.src = e.target.result as string;
				} else {
					reject(new Error("FileReader returned empty result"));
				}
			};
			reader.onerror = () => reject(new Error("Failed to read image file"));
			reader.readAsDataURL(imageSource);
		}
	});
}

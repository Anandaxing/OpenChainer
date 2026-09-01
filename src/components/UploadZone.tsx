import type React from "react";
import { useRef, useState } from "react";
import { DUMMY_SAMPLE_SCHEMATIC_DATA_URL } from "../dummies/mockData";

interface UploadZoneProps {
	onFileSelect: (file: File | string) => void;
	onError: (errorMsg: string) => void;
}

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB limit

export const UploadZone: React.FC<UploadZoneProps> = ({
	onFileSelect,
	onError,
}) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);

	const validateAndSelect = (file: File) => {
		if (!file.type.startsWith("image/")) {
			onError(
				"Invalid file format. Please upload an image file (PNG, JPG, WebP, SVG).",
			);
			return;
		}
		if (file.size > MAX_FILE_SIZE_BYTES) {
			onError("File size exceeds 4MB limit. Please upload a smaller image.");
			return;
		}
		onFileSelect(file);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		if (e.dataTransfer.files?.[0]) {
			validateAndSelect(e.dataTransfer.files[0]);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			validateAndSelect(e.target.files[0]);
		}
	};

	return (
		<div className="w-full space-y-4">
			{/* Hero Headline */}
			<div className="text-center sm:text-left space-y-1">
				<h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
					Analyze Circuit Schematics Instantly
				</h2>
				<p className="text-sm text-zinc-400">
					Upload schematic diagrams, pinout blueprints, or PCB line art to
					extract components & AC/DC maps.
				</p>
			</div>

			{/* Main Upload Dropzone */}
			<div
				tabIndex={0}
				role="button"
				aria-label="Upload schematic image"
				aria-live="polite"
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						fileInputRef.current?.click();
					}
				}}
				className={`group relative rounded-xl border-2 border-dashed p-6 sm:p-10 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
					isDragOver
						? "border-emerald-500 bg-emerald-500/10"
						: "border-zinc-800 bg-zinc-900/60 hover:border-emerald-500/50 hover:bg-zinc-900/90"
				}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/png, image/jpeg, image/webp, image/svg+xml"
					className="hidden"
					onChange={handleFileInputChange}
				/>
				<input
					ref={cameraInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleFileInputChange}
				/>

				<div className="flex flex-col items-center justify-center space-y-3">
					<div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-transform">
						<svg
							className="w-7 h-7"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<title>Upload Image Icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.8}
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>

					<div className="space-y-1">
						<p className="text-base font-semibold text-zinc-200">
							<span className="text-emerald-400 underline underline-offset-4 decoration-emerald-500/40">
								Click to upload
							</span>{" "}
							or drag & drop
						</p>
						<p className="text-xs text-zinc-400">
							PNG, JPG, WebP, SVG accepted (Maximum 4MB limit)
						</p>
					</div>

					{/* Quick Action Buttons */}
					<div
						className="flex flex-wrap items-center justify-center gap-2 pt-2"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => cameraInputRef.current?.click()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
						>
							🏞️ Upload Your Image
						</button>
						<button
							type="button"
							onClick={() => onFileSelect(DUMMY_SAMPLE_SCHEMATIC_DATA_URL)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors min-h-[44px]"
						>
							⚡ Load Sample Schematic
						</button>
					</div>
				</div>
			</div>

			{/* Privacy & Global Disclaimer */}
			<div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-2">
				<span className="text-amber-400 font-bold shrink-0">⚠</span>
				<p>
					<strong className="text-zinc-300">Disclaimer:</strong> AI-generated
					analysis — verify before building; do not upload confidential or
					proprietary circuit designs.
				</p>
			</div>
		</div>
	);
};

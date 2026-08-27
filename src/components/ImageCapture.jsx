import { useRef } from 'react'

// Capture/select a receipt photo, downscale it client-side (camera on mobile),
// and hand back a JPEG data URL. The Worker uploads it to R2 on submit.
const MAX_WIDTH = 1024
const QUALITY = 0.7

const ImageCapture = ({ value, onChange }) => {
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        onChange(canvas.toDataURL('image/jpeg', QUALITY))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Ảnh Hóa Đơn
      </label>
      {/* No `capture` attribute -> the OS picker offers BOTH camera and photo library. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        aria-label="Chụp hoặc chọn ảnh hóa đơn"
      />
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Ảnh hóa đơn"
            className="max-h-44 rounded-xl border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            aria-label="Xóa ảnh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Thêm ảnh hóa đơn
        </button>
      )}
    </div>
  )
}

export default ImageCapture

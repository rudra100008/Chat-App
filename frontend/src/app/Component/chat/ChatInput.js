import style from '../../Style/chat.module.css'

const ChatInput = ({ value, onSend, onChange, connected }) => {

    return (
        <div className={style.inputWrapper}>
            <div className={style.FieldGroup}>
                <input
                    type="text"
                    name='content'
                    id='content'
                    placeholder='Type a message'
                    className={style.FieldInput}
                    value={value}
                    onChange={onChange}
                    onKeyPress={(e) => e.key === "Enter" && onSend()}
                />
            </div>
            <div className={style.ButtonGroup}>
                <button
                    className={style.SendButton}
                    onClick={onSend}
                    disabled={!connected}
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default ChatInput;
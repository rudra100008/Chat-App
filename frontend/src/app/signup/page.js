export default function SignUp(){
    return(
        <div>
            <form action="post">
                <h1>Sign Up</h1>
                <div className="">
                    <label htmlFor="username">Username</label>
                    <input
                    id="username"
                    name="username"
                    placeholder="Enter user name"
                    />
                </div>
                <div className="">
                    <label htmlFor="email">Email</label>
                    <input
                    id="email"
                    name="email"
                    placeholder="Enter email"
                    />
                </div>
                <div>
                    <label htmlFor="phoneNumber">PhoneNumber</label>
                    <input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Enter phoneNumber"
                    />
                </div>
                <div className="">
                    <label htmlFor="password">Password</label>
                    <input
                    id="password"
                    name="password"
                    placeholder="Enter password"
                    />
                </div>
            </form>
        </div>
    )
}
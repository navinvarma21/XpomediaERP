import MainContent from "../../components/MainContent/MainContentPage"
import "bootstrap/dist/css/bootstrap.min.css"
import students from "../../images/Dashboard/Students.png"
import Teachers from "../../images/Dashboard/Teachers.png"
import Parents from "../../images/Dashboard/Parents.png"
import Earnings from "../../images/Dashboard/Earnings.png"

function Home() {
  // Sample data for statistics
  const stats = {
    students: 5004,
    teachers: 322,
    parents: 4643,
    earnings: 250000,
  }

  return (
    <MainContent>
      <div className="dashboard-container">
        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle  me-3">
                  <img
                    src={students}
                    alt="Students"
                    style={{ width: "60px", height: "60px" }}
                  />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1 text-muted">Students</h6>
                  <h2 className="card-title mb-0">{stats.students}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle  me-3">
                  <img
                    src={Teachers}
                    alt="Teachers"
                    style={{ width: "60px", height: "60px" }}
                  />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1 text-muted">Teachers</h6>
                  <h2 className="card-title mb-0">{stats.teachers}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle  me-3">
                  <img
                    src={Parents}
                    alt="Parents"
                    style={{ width: "60px", height: "60px" }}
                  />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1 text-muted">Parents</h6>
                  <h2 className="card-title mb-0">{stats.parents}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle  me-3">
                  <img
                    src={Earnings}
                    alt="Earnings"
                    style={{ width: "60px", height: "60px" }}
                  />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1 text-muted">Earnings</h6>
                  <h2 className="card-title mb-0">₹{stats.earnings}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row g-4 mb-4">
          {/* Earnings Chart */}
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Earnings</h5>
                  <div className="dropdown">
                    <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      June 10, 2021
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <a className="dropdown-item" href="#!">
                          Last 7 days
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#!">
                          Last 30 days
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#!">
                          Last 90 days
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div style={{ height: "300px", backgroundColor: "#f8f9fa" }} className="rounded">
                  {/* Add your chart component here */}
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Chart */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Expenses</h5>
                <div style={{ height: "300px", backgroundColor: "#f8f9fa" }} className="rounded">
                  {/* Add your pie chart component here */}
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">Pie Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar and Reminders Section */}
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Event Calendar</h5>
                <div style={{ height: "400px", backgroundColor: "#f8f9fa" }} className="rounded">
                  {/* Add your calendar component here */}
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">Calendar Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Reminders</h5>
                <div className="reminders-list">
                  {/* Sample Reminders */}
                  <div className="reminder-item p-3 mb-3 bg-light rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="badge bg-info">16 June, 2021</span>
                    </div>
                    <p className="mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                  </div>
                  <div className="reminder-item p-3 mb-3 bg-light rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="badge bg-warning">16 June, 2021</span>
                    </div>
                    <p className="mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                  </div>
                  <div className="reminder-item p-3 bg-light rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="badge bg-danger">16 June, 2021</span>
                    </div>
                    <p className="mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .bg-light-green { background-color: #e6f4ea; }
          .bg-light-blue { background-color: #e8f0fe; }
          .bg-light-yellow { background-color: #fef7e0; }
          .bg-light-red { background-color: #fce8e6; }
          
          .card {
            transition: transform 0.2s ease-in-out;
          }
          
          .card:hover {
            transform: translateY(-5px);
          }
          
          .reminder-item {
            transition: all 0.3s ease;
          }
          
          .reminder-item:hover {
            background-color: #e9ecef !important;
            cursor: pointer;
          }
        `}
      </style>
    </MainContent>
  )
}

export default Home

